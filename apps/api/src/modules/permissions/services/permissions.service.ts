import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
    });
  }

  findByModule(module: string) {
    return this.prisma.permission.findMany({
      where: { module },
      orderBy: { code: 'asc' },
    });
  }
}
