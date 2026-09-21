import { Body, Controller, Get, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@smart-office/shared';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { RecipesService } from '../services/recipes.service';
import { UpsertRecipeDto } from '../dto/recipe.dto';

@ApiTags('Recipes')
@ApiBearerAuth()
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.RECIPES_READ)
  @ApiOperation({ summary: 'List all recipes' })
  findAll() {
    return this.recipesService.findAll();
  }

  @Get('by-menu/:menuItemId')
  @RequirePermissions(PERMISSIONS.RECIPES_READ, PERMISSIONS.MENU_READ)
  @ApiOperation({ summary: 'Get recipe for a menu item' })
  findByMenuItem(@Param('menuItemId', ParseUUIDPipe) menuItemId: string) {
    return this.recipesService.findByMenuItem(menuItemId);
  }

  @Put(':menuItemId')
  @RequirePermissions(PERMISSIONS.RECIPES_UPDATE)
  @ApiOperation({ summary: 'Create or replace recipe for menu item' })
  upsert(
    @Param('menuItemId', ParseUUIDPipe) menuItemId: string,
    @Body() dto: UpsertRecipeDto,
  ) {
    return this.recipesService.upsertForMenuItem(menuItemId, dto);
  }
}
