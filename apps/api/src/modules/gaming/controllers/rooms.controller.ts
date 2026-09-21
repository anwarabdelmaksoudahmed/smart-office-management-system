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
import { RoomsService } from '../services/rooms.service';
import {
  CreateRoomDto,
  RoomsQueryDto,
  UpdateRoomDto,
} from '../dto/room.dto';

@ApiTags('Gaming')
@ApiBearerAuth()
@Controller('gaming/rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  @RequirePermissions(
    PERMISSIONS.GAMING_ROOMS_READ,
    PERMISSIONS.RESERVATIONS_CREATE,
  )
  @ApiOperation({ summary: 'List gaming rooms' })
  findAll(@Query() query: RoomsQueryDto) {
    return this.roomsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(
    PERMISSIONS.GAMING_ROOMS_READ,
    PERMISSIONS.RESERVATIONS_CREATE,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomsService.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.GAMING_ROOMS_CREATE)
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.GAMING_ROOMS_UPDATE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.GAMING_ROOMS_UPDATE)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomsService.remove(id);
  }
}
