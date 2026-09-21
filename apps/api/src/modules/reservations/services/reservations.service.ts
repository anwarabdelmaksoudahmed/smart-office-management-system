import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GamingBookingStatus, Prisma } from '@prisma/client';
import { PERMISSIONS } from '@smart-office/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginate } from '../../../common/dto/pagination.dto';
import { GamingGateway } from '../../../realtime/gaming.gateway';
import {
  CreateReservationDto,
  ExtendReservationDto,
  ReservationsQueryDto,
} from '../dto/reservation.dto';

const ACTIVE_STATUSES: GamingBookingStatus[] = [
  GamingBookingStatus.PENDING,
  GamingBookingStatus.CONFIRMED,
  GamingBookingStatus.ACTIVE,
];

const bookingInclude = {
  room: {
    select: {
      id: true,
      code: true,
      nameEn: true,
      nameAr: true,
      capacity: true,
    },
  },
  user: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  session: true,
} satisfies Prisma.GamingBookingInclude;

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamingGateway: GamingGateway,
  ) {}

  async findAll(
    query: ReservationsQueryDto,
    actor: { id: string; permissions: string[] },
  ) {
    const canManage = this.canManage(actor.permissions);
    const where: Prisma.GamingBookingWhereInput = {
      ...(canManage ? {} : { userId: actor.id }),
      ...(query.status ? { status: query.status } : {}),
      ...(query.roomId ? { roomId: query.roomId } : {}),
      ...(query.search
        ? {
            OR: [
              { number: { contains: query.search, mode: 'insensitive' } },
              { notes: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.gamingBooking.count({ where }),
      this.prisma.gamingBooking.findMany({
        where,
        include: bookingInclude,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { startAt: 'desc' },
      }),
    ]);

    return paginate(rows, total, query.page, query.limit);
  }

  async findOne(
    id: string,
    actor: { id: string; permissions: string[] },
  ) {
    const booking = await this.prisma.gamingBooking.findUnique({
      where: { id },
      include: bookingInclude,
    });
    if (!booking) throw new NotFoundException('Reservation not found');
    if (!this.canManage(actor.permissions) && booking.userId !== actor.id) {
      throw new ForbiddenException('Not allowed to view this reservation');
    }
    return booking;
  }

  async create(
    userId: string,
    dto: CreateReservationDto,
    _options?: { skipConflictPast?: boolean },
  ) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (!(endAt > startAt)) {
      throw new BadRequestException('endAt must be after startAt');
    }
    if (endAt.getTime() - startAt.getTime() < 15 * 60_000) {
      throw new BadRequestException('Minimum booking length is 15 minutes');
    }

    const room = await this.prisma.gamingRoom.findFirst({
      where: { id: dto.roomId, deletedAt: null, isActive: true },
    });
    if (!room) throw new NotFoundException('Gaming room not found');

    const partySize = dto.partySize ?? 1;
    if (partySize > room.capacity) {
      throw new BadRequestException(
        `Party size exceeds room capacity (${room.capacity})`,
      );
    }

    await this.assertNoOverlap(dto.roomId, startAt, endAt);

    const number = await this.nextNumber();
    const qrCode = `GB-${number}-${Date.now().toString(36)}`;

    const booking = await this.prisma.gamingBooking.create({
      data: {
        number,
        userId,
        roomId: dto.roomId,
        status: GamingBookingStatus.CONFIRMED,
        startAt,
        endAt,
        partySize,
        notes: dto.notes,
        qrCode,
      },
      include: bookingInclude,
    });

    this.emit(booking);
    return booking;
  }

  async cancel(
    id: string,
    actor: { id: string; permissions: string[] },
  ) {
    const booking = await this.findOne(id, actor);
    if (
      booking.status === GamingBookingStatus.CANCELLED ||
      booking.status === GamingBookingStatus.COMPLETED
    ) {
      throw new BadRequestException(`Cannot cancel ${booking.status} booking`);
    }
    if (booking.status === GamingBookingStatus.ACTIVE) {
      throw new BadRequestException('End the active session instead of cancelling');
    }

    const updated = await this.prisma.gamingBooking.update({
      where: { id },
      data: {
        status: GamingBookingStatus.CANCELLED,
        cancelledAt: new Date(),
      },
      include: bookingInclude,
    });

    this.emit(updated);
    return updated;
  }

  async start(id: string, _actorId: string) {
    const booking = await this.prisma.gamingBooking.findUnique({
      where: { id },
      include: bookingInclude,
    });
    if (!booking) throw new NotFoundException('Reservation not found');
    if (
      booking.status !== GamingBookingStatus.CONFIRMED &&
      booking.status !== GamingBookingStatus.PENDING
    ) {
      throw new BadRequestException(`Cannot start booking in ${booking.status}`);
    }
    if (booking.session) {
      throw new BadRequestException('Session already started');
    }

    await this.assertNoOverlap(
      booking.roomId,
      new Date(),
      booking.endAt,
      booking.id,
    );

    const startedAt = new Date();
    const endsAt =
      booking.endAt > startedAt
        ? booking.endAt
        : new Date(startedAt.getTime() + 60 * 60_000);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.gamingSession.create({
        data: {
          bookingId: booking.id,
          startedAt,
          endsAt,
        },
      });
      return tx.gamingBooking.update({
        where: { id },
        data: {
          status: GamingBookingStatus.ACTIVE,
          startAt: startedAt,
          endAt: endsAt,
        },
        include: bookingInclude,
      });
    });

    this.emit(updated);
    return updated;
  }

  async extend(id: string, dto: ExtendReservationDto) {
    const booking = await this.prisma.gamingBooking.findUnique({
      where: { id },
      include: bookingInclude,
    });
    if (!booking) throw new NotFoundException('Reservation not found');
    if (booking.status !== GamingBookingStatus.ACTIVE || !booking.session) {
      throw new BadRequestException('Only active sessions can be extended');
    }

    const newEndsAt = new Date(
      booking.session.endsAt.getTime() + dto.minutes * 60_000,
    );

    await this.assertNoOverlap(
      booking.roomId,
      booking.startAt,
      newEndsAt,
      booking.id,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.gamingSession.update({
        where: { bookingId: id },
        data: {
          endsAt: newEndsAt,
          extendedMin: { increment: dto.minutes },
        },
      });
      return tx.gamingBooking.update({
        where: { id },
        data: { endAt: newEndsAt },
        include: bookingInclude,
      });
    });

    this.emit(updated);
    return updated;
  }

  async complete(id: string) {
    const booking = await this.prisma.gamingBooking.findUnique({
      where: { id },
      include: bookingInclude,
    });
    if (!booking) throw new NotFoundException('Reservation not found');
    if (booking.status !== GamingBookingStatus.ACTIVE) {
      throw new BadRequestException('Only ACTIVE bookings can be completed');
    }

    const endedAt = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      if (booking.session) {
        await tx.gamingSession.update({
          where: { bookingId: id },
          data: { endedAt },
        });
      }
      return tx.gamingBooking.update({
        where: { id },
        data: { status: GamingBookingStatus.COMPLETED },
        include: bookingInclude,
      });
    });

    this.emit(updated);
    return updated;
  }

  async activeSessions() {
    return this.prisma.gamingBooking.findMany({
      where: { status: GamingBookingStatus.ACTIVE },
      include: bookingInclude,
      orderBy: { startAt: 'asc' },
    });
  }

  private canManage(permissions: string[]) {
    return (
      permissions.includes(PERMISSIONS.RESERVATIONS_MANAGE) ||
      permissions.includes(PERMISSIONS.GAMING_QUEUE_MANAGE)
    );
  }

  private async assertNoOverlap(
    roomId: string,
    startAt: Date,
    endAt: Date,
    excludeId?: string,
  ) {
    const clash = await this.prisma.gamingBooking.findFirst({
      where: {
        roomId,
        status: { in: ACTIVE_STATUSES },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true, number: true, startAt: true, endAt: true },
    });
    if (clash) {
      throw new ConflictException(
        `Room unavailable — conflicts with ${clash.number}`,
      );
    }
  }

  private async nextNumber() {
    const day = new Date();
    const prefix = `GB-${day.getFullYear()}${String(day.getMonth() + 1).padStart(2, '0')}${String(day.getDate()).padStart(2, '0')}-`;
    const last = await this.prisma.gamingBooking.findFirst({
      where: { number: { startsWith: prefix } },
      orderBy: { number: 'desc' },
      select: { number: true },
    });
    const seq = last ? Number(last.number.slice(prefix.length)) + 1 : 1;
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  private emit(booking: {
    id: string;
    userId: string;
    roomId: string;
    status: string;
  }) {
    this.gamingGateway.emitReservationUpdated({
      id: booking.id,
      userId: booking.userId,
      roomId: booking.roomId,
      status: booking.status,
    });
  }
}
