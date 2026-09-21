import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GamingBookingStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AvailabilityQueryDto } from '../dto/availability.dto';

const ACTIVE_STATUSES: GamingBookingStatus[] = [
  GamingBookingStatus.PENDING,
  GamingBookingStatus.CONFIRMED,
  GamingBookingStatus.ACTIVE,
];

const OPEN_HOUR = 9;
const CLOSE_HOUR = 21;

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getSlots(query: AvailabilityQueryDto) {
    const room = await this.prisma.gamingRoom.findFirst({
      where: { id: query.roomId, deletedAt: null, isActive: true },
    });
    if (!room) throw new NotFoundException('Gaming room not found');

    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(query.date);
    if (!dateMatch) {
      throw new BadRequestException('date must be YYYY-MM-DD');
    }

    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]) - 1;
    const day = Number(dateMatch[3]);
    const slotMinutes = query.slotMinutes ?? 60;

    const dayStart = new Date(year, month, day, OPEN_HOUR, 0, 0, 0);
    const dayEnd = new Date(year, month, day, CLOSE_HOUR, 0, 0, 0);

    const bookings = await this.prisma.gamingBooking.findMany({
      where: {
        roomId: query.roomId,
        status: { in: ACTIVE_STATUSES },
        startAt: { lt: dayEnd },
        endAt: { gt: dayStart },
      },
      select: {
        id: true,
        number: true,
        startAt: true,
        endAt: true,
        status: true,
        partySize: true,
      },
      orderBy: { startAt: 'asc' },
    });

    const slots: Array<{
      startAt: string;
      endAt: string;
      available: boolean;
    }> = [];

    for (
      let cursor = dayStart.getTime();
      cursor + slotMinutes * 60_000 <= dayEnd.getTime();
      cursor += slotMinutes * 60_000
    ) {
      const startAt = new Date(cursor);
      const endAt = new Date(cursor + slotMinutes * 60_000);
      const overlap = bookings.some(
        (b) => b.startAt < endAt && b.endAt > startAt,
      );
      slots.push({
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        available: !overlap,
      });
    }

    return {
      room: {
        id: room.id,
        code: room.code,
        nameEn: room.nameEn,
        nameAr: room.nameAr,
        capacity: room.capacity,
      },
      date: query.date,
      slotMinutes,
      openHour: OPEN_HOUR,
      closeHour: CLOSE_HOUR,
      slots,
      bookings,
    };
  }
}
