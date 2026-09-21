import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AuditLog, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginate } from '../../../common/dto/pagination.dto';
import { AuditLogsQueryDto } from '../dto/audit.dto';

export interface AuditEntry {
  actorId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<AuditLog | null> {
    try {
      return await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          metadata: entry.metadata,
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to write audit log: ${(error as Error).message}`);
      return null;
    }
  }

  async findAll(query: AuditLogsQueryDto) {
    const where: Prisma.AuditLogWhereInput = {
      ...(query.action
        ? { action: { contains: query.action, mode: 'insensitive' } }
        : {}),
      ...(query.resource
        ? { resource: { contains: query.resource, mode: 'insensitive' } }
        : {}),
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(query.search
        ? {
            OR: [
              { action: { contains: query.search, mode: 'insensitive' } },
              { resource: { contains: query.search, mode: 'insensitive' } },
              { resourceId: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return paginate(rows, total, query.page, query.limit);
  }

  async findOne(id: string) {
    const row = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    if (!row) throw new NotFoundException('Audit log not found');
    return row;
  }
}
