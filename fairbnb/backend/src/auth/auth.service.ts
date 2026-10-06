import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { UserRole, type User } from '@prisma/client';

const BCRYPT_SALT_ROUNDS = 10;
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_LOCK_MINUTES = 30;
const RESET_TOKEN_EXPIRY_MINUTES = 30;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  // ──────────────────────────────── REGISTER ────────────────────────────────

  async register(dto: RegisterDto) {
    // Check email uniqueness (if provided)
    if (dto.email) {
      const existingEmail = await this.usersService.findByEmail(dto.email);
      if (existingEmail) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    // Check phone uniqueness
    const existingPhone = await this.usersService.findByPhone(dto.phone);
    if (existingPhone) {
      throw new ConflictException('A user with this phone number already exists');
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    // Create user — ALWAYS force role = USER regardless of any input
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email || null,
      phone: dto.phone,
      passwordHash,
      role: UserRole.USER, // forced — never from client
    });

    return {
      message: 'Registration successful',
      user: this.usersService.sanitizeUser(user),
    };
  }

  // ──────────────────────────────── LOGIN ────────────────────────────────────

  async login(dto: LoginDto) {
    // Find user by email
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is a co-host (has active CoHostRelationship records)
    let isCoHost = false;
    if (user.role === UserRole.HOST) {
      const coHostCount = await this.prisma.coHostRelationship.count({
        where: { coHostUserId: user.id, status: 'ACTIVE' },
      });
      isCoHost = coHostCount > 0;
    }

    // Generate JWT — minimal payload
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: this.usersService.sanitizeUser(user),
      isCoHost,
    };
  }

  // ──────────────────────────────── SEND OTP ────────────────────────────────

  async sendOtp(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.phoneVerified) {
      throw new BadRequestException('Phone number is already verified');
    }

    // Check OTP lock
    if (user.otpLockUntil && user.otpLockUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.otpLockUntil.getTime() - Date.now()) / 60000,
      );
      throw new BadRequestException(
        `Too many failed attempts. Try again in ${minutesLeft} minutes`,
      );
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, BCRYPT_SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store hashed OTP
    await this.usersService.update(userId, {
      phoneOtpHash: otpHash,
      phoneOtpExpiresAt: expiresAt,
      otpFailedAttempts: 0,
      otpLockUntil: null,
    });

    // TODO: Send OTP via SMS provider
    // For development, log the OTP to console
    this.logger.log(`[DEV] OTP for ${user.phone}: ${otp}`);

    return {
      message: 'OTP sent successfully',
      // In production, remove this. Only for development testing.
      ...(process.env.NODE_ENV !== 'production' && { devOtp: otp }),
    };
  }

  // ──────────────────────────────── VERIFY OTP ──────────────────────────────

  async verifyOtp(userId: string, dto: VerifyOtpDto) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.phoneVerified) {
      throw new BadRequestException('Phone number is already verified');
    }

    // Check OTP lock
    if (user.otpLockUntil && user.otpLockUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.otpLockUntil.getTime() - Date.now()) / 60000,
      );
      throw new BadRequestException(
        `Too many failed attempts. Try again in ${minutesLeft} minutes`,
      );
    }

    // Check if OTP exists and is not expired
    if (!user.phoneOtpHash || !user.phoneOtpExpiresAt) {
      throw new BadRequestException('No OTP has been sent. Please request a new OTP');
    }

    if (user.phoneOtpExpiresAt < new Date()) {
      throw new BadRequestException('OTP has expired. Please request a new OTP');
    }

    // Verify OTP
    const isOtpValid = await bcrypt.compare(dto.otp, user.phoneOtpHash);

    if (!isOtpValid) {
      const newAttempts = user.otpFailedAttempts + 1;
      const updateData: Record<string, unknown> = {
        otpFailedAttempts: newAttempts,
      };

      // Lock if max attempts reached
      if (newAttempts >= OTP_MAX_ATTEMPTS) {
        updateData.otpLockUntil = new Date(
          Date.now() + OTP_LOCK_MINUTES * 60 * 1000,
        );
        updateData.phoneOtpHash = null;
        updateData.phoneOtpExpiresAt = null;
        updateData.otpFailedAttempts = 0;
      }

      await this.usersService.update(userId, updateData);
      throw new BadRequestException('Invalid OTP');
    }

    // OTP is valid — mark phone as verified
    await this.usersService.update(userId, {
      phoneVerified: true,
      phoneOtpHash: null,
      phoneOtpExpiresAt: null,
      otpFailedAttempts: 0,
      otpLockUntil: null,
    });

    return { message: 'Phone number verified successfully' };
  }

  // ──────────────────────────── CHANGE PASSWORD ─────────────────────────────

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isCurrentValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(dto.newPassword, BCRYPT_SALT_ROUNDS);

    await this.usersService.update(userId, {
      passwordHash: newPasswordHash,
    });

    return { message: 'Password changed successfully' };
  }

  // ──────────────────────────── FORGOT PASSWORD ─────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);

    // Always return success to prevent email enumeration
    if (!user) {
      return {
        message:
          'If an account with that email exists, a password reset link has been sent',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, BCRYPT_SALT_ROUNDS);
    const expiresAt = new Date(
      Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000,
    );

    await this.usersService.update(user.id, {
      resetTokenHash,
      resetTokenExpiresAt: expiresAt,
    });

    // TODO: Send reset link via email provider
    // For development, log the token
    this.logger.log(`[DEV] Reset token for ${user.email}: ${resetToken}`);

    return {
      message:
        'If an account with that email exists, a password reset link has been sent',
      // In production, remove this. Only for development testing.
      ...(process.env.NODE_ENV !== 'production' && { devResetToken: resetToken }),
    };
  }

  // ──────────────────────────── RESET PASSWORD ──────────────────────────────

  async resetPassword(dto: ResetPasswordDto) {
    // Find users with non-expired reset tokens and compare
    const usersWithResetTokens = await this.prisma.user.findMany({
      where: {
        resetTokenHash: { not: null },
        resetTokenExpiresAt: { gt: new Date() },
      },
    });
  
    let matchedUser: User | null = null;
    for (const user of usersWithResetTokens) {
      if (user.resetTokenHash) {
        const isMatch = await bcrypt.compare(dto.resetToken, user.resetTokenHash);
        if (isMatch) {
          matchedUser = user;
          break;
        }
      }
    }
                                              
    if (!matchedUser) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(dto.newPassword, BCRYPT_SALT_ROUNDS);

    await this.usersService.update(matchedUser.id, {
      passwordHash: newPasswordHash,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    });

    return { message: 'Password reset successfully' };
  }
}
