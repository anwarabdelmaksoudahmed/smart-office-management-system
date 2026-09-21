import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CategoriesQueryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: CategoriesQueryDto) {
    const where: Prisma.CategoryWhereInput = {
      deletedAt: null,
      ...(query.activeOnly ? { isActive: true } : {}),
      ...(query.search
        ? {
            OR: [
              { nameEn: { contains: query.search, mode: 'insensitive' } },
              { nameAr: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.tree ? { parentId: null } : {}),
    };

    return this.prisma.category.findMany({
      where,
      include: {
        _count: { select: { items: true } },
        ...(query.tree
          ? {
              children: {
                where: { deletedAt: null },
                orderBy: { sortOrder: 'asc' },
                include: { _count: { select: { items: true } } },
              },
            }
          : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: {
        parent: true,
        children: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
        _count: { select: { items: true } },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(dto: CreateCategoryDto) {
    await this.assertSlugUnique(dto.slug);
    if (dto.parentId) await this.findOne(dto.parentId);

    return this.prisma.category.create({
      data: {
        slug: dto.slug,
        nameEn: dto.nameEn,
        nameAr: dto.nameAr,
        description: dto.description,
        imageUrl: dto.imageUrl,
        parentId: dto.parentId,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);
    if (dto.slug) await this.assertSlugUnique(dto.slug, id);
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new ConflictException('Category cannot be its own parent');
      }
      await this.findOne(dto.parentId);
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        slug: dto.slug,
        nameEn: dto.nameEn,
        nameAr: dto.nameAr,
        description: dto.description,
        imageUrl: dto.imageUrl,
        parentId: dto.parentId,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { success: true };
  }

  private async assertSlugUnique(slug: string, excludeId?: string) {
    const existing = await this.prisma.category.findFirst({
      where: {
        slug,
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    if (existing) throw new ConflictException('Category slug already exists');
  }
}
