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
import { IngredientsService } from '../services/ingredients.service';
import {
  CreateIngredientDto,
  IngredientsQueryDto,
  UpdateIngredientDto,
} from '../dto/ingredient.dto';

@ApiTags('Ingredients')
@ApiBearerAuth()
@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Get()
  @RequirePermissions(
    PERMISSIONS.INGREDIENTS_READ,
    PERMISSIONS.RECIPES_READ,
    PERMISSIONS.RECIPES_UPDATE,
  )
  @ApiOperation({ summary: 'List ingredients' })
  findAll(@Query() query: IngredientsQueryDto) {
    return this.ingredientsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.INGREDIENTS_READ)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ingredientsService.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.INGREDIENTS_CREATE)
  create(@Body() dto: CreateIngredientDto) {
    return this.ingredientsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.INGREDIENTS_UPDATE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIngredientDto,
  ) {
    return this.ingredientsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.INGREDIENTS_DELETE)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ingredientsService.remove(id);
  }
}
