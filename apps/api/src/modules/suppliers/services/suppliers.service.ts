import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginate } from '../../../common/dto/pagination.dto';
import {
  CreateSupplierDto,
  SuppliersQueryDto,
  UpdateSupplierDto,
} from '../dto/supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: SuppliersQueryDto) {
    const where: Prisma.SupplierWhereInput = {
      deletedAt: null,
      ...(query.activeOnly ? { isActive: true } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { code: { contains: query.search, mode: 'insensitive' } },
              { contactName: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.supplier.count({ where }),
      this.prisma.supplier.findMany({
        where,
        include: { _count: { select: { purchaseOrders: true } } },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { name: 'asc' },
      }),
    ]);

    return paginate(rows, total, query.page, query.limit);
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { purchaseOrders: true } } },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async create(dto: CreateSupplierDto) {
    const exists = await this.prisma.supplier.findFirst({
      where: { code: dto.code, deletedAt: null },
    });
    if (exists) throw new ConflictException('Supplier code already exists');

    return this.prisma.supplier.create({
      data: {
        code: dto.code,
        name: dto.name,
        contactName: dto.contactName,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateSupplierDto) {
    await this.findOne(id);
    if (dto.code) {
      const clash = await this.prisma.supplier.findFirst({
        where: { code: dto.code, deletedAt: null, NOT: { id } },
      });
      if (clash) throw new ConflictException('Supplier code already exists');
    }

    return this.prisma.supplier.update({
      where: { id },
      data: {
        code: dto.code,
        name: dto.name,
        contactName: dto.contactName,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        isActive: dto.isActive,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { success: true };
  }
}
