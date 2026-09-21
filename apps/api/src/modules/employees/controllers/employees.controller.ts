import {
  Body,
  Controller,
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
import { EmployeesService } from '../services/employees.service';
import {
  EmployeesQueryDto,
  RedeemRewardsDto,
  UpdateEmployeeDto,
} from '../dto/employee.dto';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get('me')
  @ApiOperation({ summary: 'Current employee profile + balances' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.employeesService.me(user.id);
  }

  @Get('me/balance')
  @ApiOperation({ summary: 'Reward points + free drink balance' })
  balance(@CurrentUser() user: AuthenticatedUser) {
    return this.employeesService.balance(user.id);
  }

  @Post('me/rewards/redeem')
  @ApiOperation({ summary: 'Redeem points for free drink(s)' })
  redeem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RedeemRewardsDto,
  ) {
    return this.employeesService.redeem(user.id, dto.freeDrinks);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.EMPLOYEES_READ)
  @ApiOperation({ summary: 'List employee profiles (HR)' })
  findAll(@Query() query: EmployeesQueryDto) {
    return this.employeesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.EMPLOYEES_READ)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.EMPLOYEES_UPDATE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, dto);
  }
}
