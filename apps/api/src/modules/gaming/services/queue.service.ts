import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WaitingQueueStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { GamingGateway } from '../../../realtime/gaming.gateway';
import { ReservationsService } from '../../reservations/services/reservations.service';
import { JoinQueueDto, SeatQueueDto } from '../dto/queue.dto';

@Injectable()
export class QueueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamingGateway: GamingGateway,
    private readonly reservationsService: ReservationsService,
  ) {}

  async list(roomId?: string) {
    const where = {
      status: { in: [WaitingQueueStatus.WAITING, WaitingQueueStatus.NOTIFIED] },
      ...(roomId ? { roomId } : {}),
    };

    return this.prisma.waitingQueueEntry.findMany({
      where,
      include: {
        room: {
          select: { id: true, code: true, nameEn: true, nameAr: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: [{ roomId: 'asc' }, { position: 'asc' }],
    });
  }

  async join(userId: string, dto: JoinQueueDto) {
    const room = await this.prisma.gamingRoom.findFirst({
      where: { id: dto.roomId, deletedAt: null, isActive: true },
    });
    if (!room) throw new NotFoundException('Gaming room not found');

    const existing = await this.prisma.waitingQueueEntry.findFirst({
      where: {
        roomId: dto.roomId,
        userId,
        status: { in: [WaitingQueueStatus.WAITING, WaitingQueueStatus.NOTIFIED] },
      },
    });
    if (existing) {
      throw new ConflictException('Already in queue for this room');
    }

    const maxPos = await this.prisma.waitingQueueEntry.aggregate({
      where: {
        roomId: dto.roomId,
        status: { in: [WaitingQueueStatus.WAITING, WaitingQueueStatus.NOTIFIED] },
      },
      _max: { position: true },
    });

    const entry = await this.prisma.waitingQueueEntry.create({
      data: {
        roomId: dto.roomId,
        userId,
        partySize: dto.partySize ?? 1,
        position: (maxPos._max.position ?? 0) + 1,
        status: WaitingQueueStatus.WAITING,
      },
      include: {
        room: {
          select: { id: true, code: true, nameEn: true, nameAr: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await this.emitQueue(dto.roomId);
    return entry;
  }

  async leave(id: string, userId: string, canManage: boolean) {
    const entry = await this.prisma.waitingQueueEntry.findUnique({
      where: { id },
    });
    if (!entry) throw new NotFoundException('Queue entry not found');
    if (!canManage && entry.userId !== userId) {
      throw new BadRequestException('Cannot leave another user queue entry');
    }
    if (
      entry.status !== WaitingQueueStatus.WAITING &&
      entry.status !== WaitingQueueStatus.NOTIFIED
    ) {
      throw new BadRequestException('Entry is not active in queue');
    }

    await this.prisma.waitingQueueEntry.update({
      where: { id },
      data: { status: WaitingQueueStatus.CANCELLED },
    });
    await this.reposition(entry.roomId);
    await this.emitQueue(entry.roomId);
    return { success: true };
  }

  async notify(id: string) {
    const entry = await this.prisma.waitingQueueEntry.findUnique({
      where: { id },
      include: {
        room: {
          select: { id: true, code: true, nameEn: true, nameAr: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    if (!entry) throw new NotFoundException('Queue entry not found');
    if (entry.status !== WaitingQueueStatus.WAITING) {
      throw new BadRequestException('Only WAITING entries can be notified');
    }

    const updated = await this.prisma.waitingQueueEntry.update({
      where: { id },
      data: {
        status: WaitingQueueStatus.NOTIFIED,
        notifiedAt: new Date(),
      },
      include: {
        room: {
          select: { id: true, code: true, nameEn: true, nameAr: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await this.emitQueue(entry.roomId);
    return updated;
  }

  async seat(id: string, actorId: string, dto: SeatQueueDto) {
    const entry = await this.prisma.waitingQueueEntry.findUnique({
      where: { id },
    });
    if (!entry) throw new NotFoundException('Queue entry not found');
    if (
      entry.status !== WaitingQueueStatus.WAITING &&
      entry.status !== WaitingQueueStatus.NOTIFIED
    ) {
      throw new BadRequestException('Entry is not seatable');
    }

    const durationMin = dto.durationMin ?? 60;
    const startAt = new Date();
    const endAt = new Date(startAt.getTime() + durationMin * 60_000);

    const booking = await this.reservationsService.create(
      entry.userId,
      {
        roomId: entry.roomId,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        partySize: entry.partySize,
        notes: 'Seated from waiting queue',
      },
      { skipConflictPast: true },
    );

    const started = await this.reservationsService.start(booking.id, actorId);

    await this.prisma.waitingQueueEntry.update({
      where: { id },
      data: { status: WaitingQueueStatus.SEATED },
    });
    await this.reposition(entry.roomId);
    await this.emitQueue(entry.roomId);

    return { entryId: id, booking: started };
  }

  private async reposition(roomId: string) {
    const active = await this.prisma.waitingQueueEntry.findMany({
      where: {
        roomId,
        status: {
          in: [WaitingQueueStatus.WAITING, WaitingQueueStatus.NOTIFIED],
        },
      },
      orderBy: { position: 'asc' },
    });

    await this.prisma.$transaction(
      active.map((e, i) =>
        this.prisma.waitingQueueEntry.update({
          where: { id: e.id },
          data: { position: i + 1 },
        }),
      ),
    );
  }

  private async emitQueue(roomId: string) {
    const entries = await this.list(roomId);
    this.gamingGateway.emitQueueUpdated(roomId, entries);
  }
}
