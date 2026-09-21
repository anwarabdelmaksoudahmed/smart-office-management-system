import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@smart-office/shared';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/types/auth.types';
import { ReservationsService } from '../services/reservations.service';
import {
  CreateReservationDto,
  ExtendReservationDto,
  ReservationsQueryDto,
} from '../dto/reservation.dto';

@ApiTags('Reservations')
@ApiBearerAuth()
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.RESERVATIONS_READ)
  @ApiOperation({ summary: 'List reservations (own unless manage)' })
  findAll(
    @Query() query: ReservationsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reservationsService.findAll(query, {
      id: user.id,
      permissions: user.permissions,
    });
  }

  @Get('active')
  @RequirePermissions(PERMISSIONS.RESERVATIONS_MANAGE)
  @ApiOperation({ summary: 'Active gaming sessions' })
  active() {
    return this.reservationsService.activeSessions();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.RESERVATIONS_READ)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reservationsService.findOne(id, {
      id: user.id,
      permissions: user.permissions,
    });
  }

  @Post()
  @RequirePermissions(PERMISSIONS.RESERVATIONS_CREATE)
  @ApiOperation({ summary: 'Book a gaming slot' })
  create(
    @Body() dto: CreateReservationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reservationsService.create(user.id, dto);
  }

  @Post(':id/cancel')
  @RequirePermissions(
    PERMISSIONS.RESERVATIONS_CANCEL,
    PERMISSIONS.RESERVATIONS_MANAGE,
  )
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reservationsService.cancel(id, {
      id: user.id,
      permissions: user.permissions,
    });
  }

  @Post(':id/start')
  @RequirePermissions(PERMISSIONS.RESERVATIONS_MANAGE)
  @ApiOperation({ summary: 'Start session timer' })
  start(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reservationsService.start(id, user.id);
  }

  @Post(':id/extend')
  @RequirePermissions(PERMISSIONS.RESERVATIONS_MANAGE)
  @ApiOperation({ summary: 'Extend active session' })
  extend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExtendReservationDto,
  ) {
    return this.reservationsService.extend(id, dto);
  }

  @Post(':id/complete')
  @RequirePermissions(PERMISSIONS.RESERVATIONS_MANAGE)
  @ApiOperation({ summary: 'End session' })
  complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservationsService.complete(id);
  }
}
