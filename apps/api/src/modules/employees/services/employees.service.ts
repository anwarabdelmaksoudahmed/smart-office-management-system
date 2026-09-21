import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginate } from '../../../common/dto/pagination.dto';
import {
  EmployeesQueryDto,
  UpdateEmployeeDto,
} from '../dto/employee.dto';
import { RewardsService } from './rewards.service';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rewardsService: RewardsService,
  ) {}

  me(userId: string) {
    return this.rewardsService.getProfile(userId);
  }

  balance(userId: string) {
    return this.rewardsService.getBalance(userId);
  }

  redeem(userId: string, freeDrinks?: number) {
    return this.rewardsService.redeemForFreeDrinks(userId, freeDrinks ?? 1);
  }

  async findAll(query: EmployeesQueryDto) {
    const where: Prisma.EmployeeProfileWhereInput = {
      ...(query.search
        ? {
            OR: [
              { employeeCode: { contains: query.search, mode: 'insensitive' } },
              { jobTitle: { contains: query.search, mode: 'insensitive' } },
              {
                user: {
                  OR: [
                    { email: { contains: query.search, mode: 'insensitive' } },
                    {
                      firstName: {
                        contains: query.search,
                        mode: 'insensitive',
                      },
                    },
                    {
                      lastName: {
                        contains: query.search,
                        mode: 'insensitive',
                      },
                    },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.employeeProfile.count({ where }),
      this.prisma.employeeProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              status: true,
              rewardAccount: { select: { points: true } },
              freeDrinkBalance: { select: { balance: true } },
            },
          },
          department: {
            select: { id: true, code: true, nameEn: true, nameAr: true },
          },
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { employeeCode: 'asc' },
      }),
    ]);

    return paginate(rows, total, query.page, query.limit);
  }

  async findOne(id: string) {
    const profile = await this.prisma.employeeProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
            rewardAccount: true,
            freeDrinkBalance: true,
          },
        },
        department: true,
      },
    });
    if (!profile) throw new NotFoundException('Employee not found');
    return profile;
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findOne(id);
    return this.prisma.employeeProfile.update({
      where: { id },
      data: {
        jobTitle: dto.jobTitle,
        departmentId: dto.departmentId || undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        department: true,
      },
    });
  }
}
