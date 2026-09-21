import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../../audit-logs/services/audit.service';
import { UpdateSettingsDto } from '../dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findAll(group?: string) {
    return this.prisma.appSetting.findMany({
      where: group ? { group } : undefined,
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });
  }

  async updateMany(dto: UpdateSettingsDto, actorId?: string) {
    const results = [];
    for (const item of dto.settings) {
      const row = await this.prisma.appSetting.upsert({
        where: { key: item.key },
        create: {
          key: item.key,
          value: item.value as object,
          group: item.group ?? item.key.split('.')[0] ?? 'general',
        },
        update: {
          value: item.value as object,
          ...(item.group ? { group: item.group } : {}),
        },
      });
      results.push(row);
    }

    await this.audit.log({
      actorId,
      action: 'settings.update',
      resource: 'AppSetting',
      metadata: { keys: dto.settings.map((s) => s.key) },
    });

    return results;
  }
}
