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
import { DevicesService } from '../services/devices.service';
import {
  CreateDeviceDto,
  DevicesQueryDto,
  UpdateDeviceDto,
} from '../dto/device.dto';

@ApiTags('Gaming')
@ApiBearerAuth()
@Controller('gaming/devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.GAMING_DEVICES_READ)
  @ApiOperation({ summary: 'List gaming devices' })
  findAll(@Query() query: DevicesQueryDto) {
    return this.devicesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.GAMING_DEVICES_READ)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.devicesService.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.GAMING_DEVICES_CREATE)
  create(@Body() dto: CreateDeviceDto) {
    return this.devicesService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.GAMING_DEVICES_UPDATE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeviceDto,
  ) {
    return this.devicesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.GAMING_DEVICES_UPDATE)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.devicesService.remove(id);
  }
}
