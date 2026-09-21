import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginate } from '../../../common/dto/pagination.dto';
import { AuthService } from '../../auth/services/auth.service';
import { CreateUserDto, UpdateUserDto, UsersQueryDto } from '../dto/user.dto';

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatarUrl: true,
  locale: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  roles: {
    include: { role: { select: { id: true, code: true, nameEn: true, nameAr: true } } },
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: UsersQueryDto) {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { email: { contains: query.search, mode: 'insensitive' } },
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: userSelect,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
      }),
    ]);

    return paginate(rows, total, query.page, query.limit);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: userSelect,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await AuthService.hashPassword(dto.password);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        locale: dto.locale ?? 'en',
        status: UserStatus.ACTIVE,
        ...(dto.roleIds?.length
          ? {
              roles: {
                create: dto.roleIds.map((roleId) => ({ roleId })),
              },
            }
          : {}),
      },
      select: userSelect,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    if (dto.email) {
      const clash = await this.prisma.user.findFirst({
        where: { email: dto.email, deletedAt: null, NOT: { id } },
      });
      if (clash) throw new ConflictException('Email already in use');
    }

    const passwordHash = dto.password
      ? await AuthService.hashPassword(dto.password)
      : undefined;

    return this.prisma.$transaction(async (tx) => {
      if (dto.roleIds) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        if (dto.roleIds.length) {
          await tx.userRole.createMany({
            data: dto.roleIds.map((roleId) => ({ userId: id, roleId })),
          });
        }
      }

      return tx.user.update({
        where: { id },
        data: {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          locale: dto.locale,
          status: dto.status,
          ...(passwordHash ? { passwordHash } : {}),
        },
        select: userSelect,
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: UserStatus.INACTIVE },
    });
    return { success: true };
  }
}
