import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, User, UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async findAll(): Promise<Omit<User, 'passwordHash' | 'phoneOtpHash' | 'resetTokenHash'>[]> {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        coHostCode: true,
        verifiedById: true,
        verifiedAt: true,
        role: true,
        phoneVerified: true,
        emailVerified: true,
        isActive: true,
        isSuperhost: true,
        blockReason: true,
        kycStatus: true,
        kycDocumentUrl: true,
        kycNote: true,
        avatarUrl: true,
        bio: true,
        emergencyContact: true,
        preferredCurrency: true,
        preferredLanguage: true,
        phoneOtpExpiresAt: true,
        otpFailedAttempts: true,
        otpLockUntil: true,
        resetTokenExpiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async updateStatus(id: string, isActive: boolean): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
    });
  }

  /**
   * Returns a safe user object without sensitive fields.
   */
  sanitizeUser(user: User) {
    const {
      passwordHash,
      phoneOtpHash,
      resetTokenHash,
      resetTokenExpiresAt,
      phoneOtpExpiresAt,
      otpFailedAttempts,
      otpLockUntil,
      ...safeUser
    } = user;
    return safeUser;
  }
}
