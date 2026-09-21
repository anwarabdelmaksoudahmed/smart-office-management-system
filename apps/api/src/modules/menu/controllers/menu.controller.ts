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
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/types/auth.types';
import { MenuService } from '../services/menu.service';
import {
  CreateMenuItemDto,
  MenuQueryDto,
  UpdateMenuItemDto,
} from '../dto/menu.dto';

@ApiTags('Menu')
@ApiBearerAuth()
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.MENU_READ)
  @ApiOperation({ summary: 'Browse / list menu items' })
  findAll(
    @Query() query: MenuQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.menuService.findAll(query, user.id);
  }

  @Get('favorites')
  @RequirePermissions(PERMISSIONS.MENU_READ)
  @ApiOperation({ summary: 'List current user favorites' })
  favorites(@CurrentUser() user: AuthenticatedUser) {
    return this.menuService.listFavorites(user.id);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MENU_READ)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.menuService.findOne(id, user.id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MENU_CREATE)
  create(@Body() dto: CreateMenuItemDto) {
    return this.menuService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MENU_UPDATE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.menuService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.MENU_DELETE)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.menuService.remove(id);
  }

  @Post(':id/favorite')
  @RequirePermissions(PERMISSIONS.MENU_READ)
  addFavorite(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.menuService.addFavorite(user.id, id);
  }

  @Delete(':id/favorite')
  @RequirePermissions(PERMISSIONS.MENU_READ)
  removeFavorite(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.menuService.removeFavorite(user.id, id);
  }
}
