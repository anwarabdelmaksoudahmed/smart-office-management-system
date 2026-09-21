import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@smart-office/shared';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/types/auth.types';
import { QueueService } from '../services/queue.service';
import { JoinQueueDto, SeatQueueDto } from '../dto/queue.dto';

@ApiTags('Gaming')
@ApiBearerAuth()
@Controller('gaming/queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.GAMING_QUEUE)
  @ApiOperation({ summary: 'List waiting queue' })
  @ApiQuery({ name: 'roomId', required: false })
  list(@Query('roomId') roomId?: string) {
    return this.queueService.list(roomId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.GAMING_QUEUE)
  @ApiOperation({ summary: 'Join waiting queue' })
  join(@Body() dto: JoinQueueDto, @CurrentUser() user: AuthenticatedUser) {
    return this.queueService.join(user.id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.GAMING_QUEUE)
  @ApiOperation({ summary: 'Leave / cancel queue entry' })
  leave(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const canManage = user.permissions.includes(PERMISSIONS.GAMING_QUEUE_MANAGE);
    return this.queueService.leave(id, user.id, canManage);
  }

  @Post(':id/notify')
  @RequirePermissions(PERMISSIONS.GAMING_QUEUE_MANAGE)
  notify(@Param('id', ParseUUIDPipe) id: string) {
    return this.queueService.notify(id);
  }

  @Post(':id/seat')
  @RequirePermissions(PERMISSIONS.GAMING_QUEUE_MANAGE)
  @ApiOperation({ summary: 'Seat guest — creates & starts booking' })
  seat(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SeatQueueDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.queueService.seat(id, user.id, dto);
  }
}
