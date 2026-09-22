import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import {
  ALL_PERMISSION_CODES,
  PERMISSION_META,
  ROLE_META,
  ROLE_PERMISSION_MAP,
  SystemRole,
} from '@smart-office/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  AssignPermissionsDto,
  CreateRoleDto,
  UpdateRoleDto,
} from '../dto/role.dto';

@Injectable()
export class RolesService implements OnModuleInit {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.syncSystemRolePermissions();
    } catch (err) {
      this.logger.warn(
        `Could not sync system role permissions: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  /** Upsert permission catalog + refresh system role matrices from ROLE_PERMISSION_MAP */
  async syncSystemRolePermissions() {
    for (const code of ALL_PERMISSION_CODES) {
      const meta = PERMISSION_META[code];
      await this.prisma.permission.upsert({
        where: { code },
        create: {
          code,
          module: meta.module,
          nameEn: meta.nameEn,
          nameAr: meta.nameAr,
        },
        update: {
          module: meta.module,
          nameEn: meta.nameEn,
          nameAr: meta.nameAr,
        },
      });
    }

    const allPermissions = await this.prisma.permission.findMany();
    const permissionByCode = new Map(allPermissions.map((p) => [p.code, p.id]));

    for (const roleCode of Object.values(SystemRole)) {
      const meta = ROLE_META[roleCode];
      const role = await this.prisma.role.upsert({
        where: { code: roleCode },
        create: {
          code: roleCode,
          nameEn: meta.nameEn,
          nameAr: meta.nameAr,
          description: meta.description,
          isSystem: true,
        },
        update: {
          nameEn: meta.nameEn,
          nameAr: meta.nameAr,
          description: meta.description,
          isSystem: true,
        },
      });

      const mapping = ROLE_PERMISSION_MAP[roleCode];
      const codes = mapping === '*' ? ALL_PERMISSION_CODES : mapping;

      await this.prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
      await this.prisma.rolePermission.createMany({
        data: codes
          .map((code) => permissionByCode.get(code))
          .filter((id): id is string => Boolean(id))
          .map((permissionId) => ({ roleId: role.id, permissionId })),
        skipDuplicates: true,
      });
    }

    this.logger.log('Synced system role permissions from ROLE_PERMISSION_MAP');
  }

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
