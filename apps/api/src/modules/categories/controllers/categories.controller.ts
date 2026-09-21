import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@smart-office/shared';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { CategoriesService } from '../services/categories.service';
import {
  CategoriesQueryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../dto/category.dto';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.CATEGORIES_READ, PERMISSIONS.MENU_READ)
  @ApiOperation({ summary: 'List categories' })
  findAll(@Query() query: CategoriesQueryDto) {
    return this.categoriesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.CATEGORIES_READ, PERMISSIONS.MENU_READ)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CATEGORIES_CREATE)
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.CATEGORIES_UPDATE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.CATEGORIES_DELETE)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(id);
  }
}
