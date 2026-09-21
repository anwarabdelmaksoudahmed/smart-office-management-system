import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import type { JwtPayload } from '../../../common/types/auth.types';
import { AuditService } from '../../audit-logs/services/audit.service';
import {
  ChangePasswordDto,
  LoginDto,
  UpdateProfileDto,
} from '../dto/auth.dto';

const BCRYPT_ROUNDS = 12;
const AVATAR_PATTERN =
  /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=\s]+$/i;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  async login(
    dto: LoginDto,
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Account is not active');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const roles = user.roles.map((ur) => ur.role.code);
    const permissions = [
      ...new Set(
        user.roles.flatMap((ur) =>
          ur.role.permissions.map((rp) => rp.permission.code),
        ),
      ),
    ];

    const tokens = await this.issueTokens(
      {
        id: user.id,
        email: user.email,
        roles,
        permissions,
      },
      meta,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.audit.log({
      actorId: user.id,
      action: 'auth.login',
      resource: 'user',
      resourceId: user.id,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        locale: user.locale,
        roles,
        permissions,
      },
    };
  }

  async refresh(
    refreshToken: string,
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: { include: { permission: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (stored.user.status !== 'ACTIVE' || stored.user.deletedAt) {
      throw new ForbiddenException('Account is not active');
    }

    // Rotate: revoke old token
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const roles = stored.user.roles.map((ur) => ur.role.code);
    const permissions = [
      ...new Set(
        stored.user.roles.flatMap((ur) =>
          ur.role.permissions.map((rp) => rp.permission.code),
        ),
      ),
    ];

    return this.issueTokens(
      {
        id: stored.user.id,
        email: stored.user.email,
        roles,
        permissions,
      },
      meta,
    );
  }

  async logout(refreshToken: string): Promise<{ success: true }> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
        employeeProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const roles = user.roles.map((ur) => ur.role.code);
    const permissions = [
      ...new Set(
        user.roles.flatMap((ur) =>
          ur.role.permissions.map((rp) => rp.permission.code),
        ),
      ),
    ];

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      locale: user.locale,
      status: user.status,
      roles,
      permissions,
      employeeProfile: user.employeeProfile,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.avatarUrl !== undefined && dto.avatarUrl !== null) {
      const trimmed = dto.avatarUrl.trim();
      if (trimmed && !AVATAR_PATTERN.test(trimmed)) {
        throw new BadRequestException(
          'Avatar must be a jpeg/png/webp data URL',
        );
      }
      if (trimmed.length > 700_000) {
        throw new BadRequestException('Avatar image is too large (max ~500KB)');
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName !== undefined ? { firstName: dto.firstName.trim() } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName.trim() } : {}),
        ...(dto.phone !== undefined
          ? { phone: dto.phone?.trim() || null }
          : {}),
        ...(dto.locale !== undefined ? { locale: dto.locale } : {}),
        ...(dto.avatarUrl !== undefined
          ? { avatarUrl: dto.avatarUrl?.trim() || null }
          : {}),
      },
    });

    await this.audit.log({
      actorId: userId,
      action: 'auth.profile_update',
      resource: 'user',
      resourceId: userId,
    });

    return this.me(userId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const passwordHash = await AuthService.hashPassword(dto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Revoke other sessions
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.audit.log({
      actorId: userId,
      action: 'auth.password_change',
      resource: 'user',
      resourceId: userId,
    });

    return { success: true as const };
  }

  private async issueTokens(
    user: {
      id: string;
      email: string;
      roles: string[];
      permissions: string[];
    },
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
      type: 'access',
    };

    const accessTtl = this.config.getOrThrow<string>('jwt.accessTtl');
    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: this.config.getOrThrow<string>('jwt.accessSecret'),
      // Nest JWT accepts ms-style strings (15m, 7d, …)
      expiresIn: accessTtl as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    const refreshRaw = randomBytes(48).toString('hex');
    const refreshTtl = this.config.getOrThrow<string>('jwt.refreshTtl');
    const expiresAt = this.parseTtlToDate(refreshTtl);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshRaw),
        expiresAt,
        userAgent: meta?.userAgent,
        ipAddress: meta?.ipAddress,
      },
    });

    return {
      accessToken,
      refreshToken: refreshRaw,
      tokenType: 'Bearer' as const,
      expiresIn: refreshTtl,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseTtlToDate(ttl: string): Date {
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) {
      // fallback 7 days
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const ms =
      unit === 's'
        ? value * 1000
        : unit === 'm'
          ? value * 60 * 1000
          : unit === 'h'
            ? value * 60 * 60 * 1000
            : value * 24 * 60 * 60 * 1000;
    return new Date(Date.now() + ms);
  }

  static hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  }
}
