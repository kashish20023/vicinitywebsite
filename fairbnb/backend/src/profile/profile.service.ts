import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateProfileDto, SubmitKycDto } from './profile.dto.js';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        phoneVerified: true,
        emailVerified: true,
        isSuperhost: true,
        isActive: true,
        kycStatus: true,
        kycDocumentUrl: true,
        kycNote: true,
        avatarUrl: true,
        bio: true,
        emergencyContact: true,
        preferredCurrency: true,
        preferredLanguage: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.emergencyContact !== undefined && { emergencyContact: dto.emergencyContact }),
        ...(dto.preferredCurrency && { preferredCurrency: dto.preferredCurrency }),
        ...(dto.preferredLanguage && { preferredLanguage: dto.preferredLanguage }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        bio: true,
        emergencyContact: true,
        preferredCurrency: true,
        preferredLanguage: true,
        kycStatus: true,
        updatedAt: true,
      },
    });
  }

  async submitKyc(userId: string, dto: SubmitKycDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        kycDocumentUrl: dto.kycDocumentUrl,
        kycNote: dto.kycNote || null,
        kycStatus: 'SUBMITTED',
      },
      select: {
        id: true,
        kycStatus: true,
        kycDocumentUrl: true,
        kycNote: true,
      },
    });
  }
}
