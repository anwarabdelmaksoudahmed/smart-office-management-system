import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginate } from '../../../common/dto/pagination.dto';
import {
  CreateRoomDto,
  RoomsQueryDto,
  UpdateRoomDto,
} from '../dto/room.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: RoomsQueryDto) {
    const where: Prisma.GamingRoomWhereInput = {
      deletedAt: null,
      ...(query.activeOnly ? { isActive: true } : {}),
      ...(query.search
        ? {
            OR: [
              { code: { contains: query.search, mode: 'insensitive' } },
              { nameEn: { contains: query.search, mode: 'insensitive' } },
              { nameAr: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.gamingRoom.count({ where }),
      this.prisma.gamingRoom.findMany({
        where,
        include: {
          devices: {
            where: { deletedAt: null },
            orderBy: { code: 'asc' },
          },
          _count: {
            select: {
              bookings: true,
              waitingQueue: { where: { status: 'WAITING' } },
            },
          },
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { code: 'asc' },
      }),
    ]);

    return paginate(rows, total, query.page, query.limit);
  }

  async findOne(id: string) {
    const room = await this.prisma.gamingRoom.findFirst({
      where: { id, deletedAt: null },
      include: {
        devices: { where: { deletedAt: null }, orderBy: { code: 'asc' } },
        _count: {
          select: {
            bookings: true,
            waitingQueue: { where: { status: 'WAITING' } },
          },
        },
      },
    });
    if (!room) throw new NotFoundException('Gaming room not found');
    return room;
  }

  async create(dto: CreateRoomDto) {
    const exists = await this.prisma.gamingRoom.findFirst({
      where: { code: dto.code, deletedAt: null },
    });
    if (exists) throw new ConflictException('Room code already exists');

    return this.prisma.gamingRoom.create({
      data: {
        code: dto.code,
        nameEn: dto.nameEn,
        nameAr: dto.nameAr,
        capacity: dto.capacity ?? 4,
        isActive: dto.isActive ?? true,
      },
      include: { devices: true },
    });
  }

  async update(id: string, dto: UpdateRoomDto) {
    await this.findOne(id);
    if (dto.code) {
      const clash = await this.prisma.gamingRoom.findFirst({
        where: { code: dto.code, deletedAt: null, NOT: { id } },
      });
      if (clash) throw new ConflictException('Room code already exists');
    }

    return this.prisma.gamingRoom.update({
      where: { id },
      data: {
        code: dto.code,
        nameEn: dto.nameEn,
        nameAr: dto.nameAr,
        capacity: dto.capacity,
        isActive: dto.isActive,
      },
      include: {
        devices: { where: { deletedAt: null } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.gamingRoom.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { success: true };
  }
}
