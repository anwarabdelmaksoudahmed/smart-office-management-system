import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  AssignPermissionsDto,
  CreateRoleDto,
  UpdateRoleDto,
} from '../dto/role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } },
      },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async create(dto: CreateRoleDto) {
    const exists = await this.prisma.role.findUnique({
      where: { code: dto.code },
    });
    if (exists) throw new ConflictException('Role code already exists');

    return this.prisma.role.create({
      data: {
        code: dto.code,
        nameEn: dto.nameEn,
        nameAr: dto.nameAr,
        description: dto.description,
        ...(dto.permissionIds?.length
          ? {
              permissions: {
                create: dto.permissionIds.map((permissionId) => ({
                  permissionId,
                })),
              },
            }
          : {}),
      },
      include: { permissions: { include: { permission: true } } },
    });
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.findOne(id);
    if (role.isSystem && dto.code && dto.code !== role.code) {
      throw new BadRequestException('Cannot change system role code');
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        code: dto.code,
        nameEn: dto.nameEn,
        nameAr: dto.nameAr,
        description: dto.description,
      },
      include: { permissions: { include: { permission: true } } },
    });
  }

  async assignPermissions(id: string, dto: AssignPermissionsDto) {
    await this.findOne(id);

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      this.prisma.rolePermission.createMany({
        data: dto.permissionIds.map((permissionId) => ({
          roleId: id,
          permissionId,
        })),
      }),
    ]);

    return this.findOne(id);
  }
}
