import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { SystemRole } from '@smart-office/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginate } from '../../../common/dto/pagination.dto';
import { AuthService } from '../../auth/services/auth.service';
import { CreateUserDto, UpdateUserDto, UsersQueryDto } from '../dto/user.dto';

/** Café customers vs ops staff — must not share the same account */
const CUSTOMER_ROLES = new Set<string>([SystemRole.EMPLOYEE, SystemRole.GUEST]);
const OPS_ROLES = new Set<string>([
  SystemRole.BARISTA,
  SystemRole.INVENTORY_MANAGER,
  SystemRole.GAMING_SUPERVISOR,
]);

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

  private async assertCompatibleRoles(roleIds: string[]) {
    if (!roleIds.length) return;
    const roles = await this.prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { code: true },
    });
    const codes = roles.map((r) => r.code);
    const hasCustomer = codes.some((c) => CUSTOMER_ROLES.has(c));
    const hasOps = codes.some((c) => OPS_ROLES.has(c));
    if (hasCustomer && hasOps) {
      throw new BadRequestException(
        'Cannot combine employee/guest with barista, inventory, or gaming roles on the same user',
      );
    }
  }

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

    if (dto.roleIds?.length) {
      await this.assertCompatibleRoles(dto.roleIds);
    }

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

    if (dto.roleIds) {
      await this.assertCompatibleRoles(dto.roleIds);
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
