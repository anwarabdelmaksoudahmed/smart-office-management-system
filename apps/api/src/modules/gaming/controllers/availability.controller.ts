import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@smart-office/shared';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { AvailabilityService } from '../services/availability.service';
import { AvailabilityQueryDto } from '../dto/availability.dto';

@ApiTags('Gaming')
@ApiBearerAuth()
@Controller('gaming/availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  @RequirePermissions(
    PERMISSIONS.RESERVATIONS_CREATE,
    PERMISSIONS.RESERVATIONS_READ,
    PERMISSIONS.GAMING_ROOMS_READ,
  )
  @ApiOperation({ summary: 'Room availability slots for a date' })
  getSlots(@Query() query: AvailabilityQueryDto) {
    return this.availabilityService.getSlots(query);
  }
}
