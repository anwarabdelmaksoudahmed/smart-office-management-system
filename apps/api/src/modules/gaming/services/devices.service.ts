import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginate } from '../../../common/dto/pagination.dto';
import {
  CreateDeviceDto,
  DevicesQueryDto,
  UpdateDeviceDto,
} from '../dto/device.dto';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: DevicesQueryDto) {
    const where: Prisma.GamingDeviceWhereInput = {
      deletedAt: null,
      ...(query.roomId ? { roomId: query.roomId } : {}),
      ...(query.activeOnly ? { isActive: true } : {}),
      ...(query.search
        ? {
            OR: [
              { code: { contains: query.search, mode: 'insensitive' } },
              { name: { contains: query.search, mode: 'insensitive' } },
              { type: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.gamingDevice.count({ where }),
      this.prisma.gamingDevice.findMany({
        where,
        include: {
          room: {
            select: { id: true, code: true, nameEn: true, nameAr: true },
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
    const device = await this.prisma.gamingDevice.findFirst({
      where: { id, deletedAt: null },
      include: {
        room: {
          select: { id: true, code: true, nameEn: true, nameAr: true },
        },
      },
    });
    if (!device) throw new NotFoundException('Gaming device not found');
    return device;
  }

  async create(dto: CreateDeviceDto) {
    const room = await this.prisma.gamingRoom.findFirst({
      where: { id: dto.roomId, deletedAt: null },
    });
    if (!room) throw new NotFoundException('Gaming room not found');

    const exists = await this.prisma.gamingDevice.findFirst({
      where: { code: dto.code, deletedAt: null },
    });
    if (exists) throw new ConflictException('Device code already exists');

    return this.prisma.gamingDevice.create({
      data: {
        roomId: dto.roomId,
        code: dto.code,
        name: dto.name,
        type: dto.type,
        isActive: dto.isActive ?? true,
      },
      include: {
        room: {
          select: { id: true, code: true, nameEn: true, nameAr: true },
        },
      },
    });
  }

  async update(id: string, dto: UpdateDeviceDto) {
    await this.findOne(id);
    if (dto.roomId) {
      const room = await this.prisma.gamingRoom.findFirst({
        where: { id: dto.roomId, deletedAt: null },
      });
      if (!room) throw new NotFoundException('Gaming room not found');
    }
    if (dto.code) {
      const clash = await this.prisma.gamingDevice.findFirst({
        where: { code: dto.code, deletedAt: null, NOT: { id } },
      });
      if (clash) throw new ConflictException('Device code already exists');
    }

    return this.prisma.gamingDevice.update({
      where: { id },
      data: {
        roomId: dto.roomId,
        code: dto.code,
        name: dto.name,
        type: dto.type,
        isActive: dto.isActive,
      },
      include: {
        room: {
          select: { id: true, code: true, nameEn: true, nameAr: true },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.gamingDevice.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { success: true };
  }
}
