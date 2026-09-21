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
import { SuppliersService } from '../services/suppliers.service';
import {
  CreateSupplierDto,
  SuppliersQueryDto,
  UpdateSupplierDto,
} from '../dto/supplier.dto';

@ApiTags('Suppliers')
@ApiBearerAuth()
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.SUPPLIERS_READ, PERMISSIONS.PURCHASES_READ)
  @ApiOperation({ summary: 'List suppliers' })
  findAll(@Query() query: SuppliersQueryDto) {
    return this.suppliersService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.SUPPLIERS_READ)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.SUPPLIERS_CREATE)
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.SUPPLIERS_UPDATE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.SUPPLIERS_DELETE)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.remove(id);
  }
}
