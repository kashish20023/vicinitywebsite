import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    companyName?: string;
    gstin?: string;
    billingAddress?: string;
  }) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    if (dto.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone.trim() },
      });
      if (existingPhone) {
        throw new BadRequestException('Phone number already registered');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name.trim(),
        phone: dto.phone?.trim() || null,
        companyName: dto.companyName?.trim() || null,
        gstin: dto.gstin?.trim() || null,
        billingAddress: dto.billingAddress?.trim() || null,
        role: Role.USER, // Public registration strictly assigns USER
      },
      include: {
        adminScope: true,
        hostedWorkspaces: { select: { id: true, name: true, slug: true, city: true } },
        cohostPermissions: {
          include: {
            workspace: { select: { id: true, name: true, slug: true, city: true } },
          },
        },
      },
    });

    const token = this.generateToken(user);
    return {
      user: this.formatUserResponse(user),
      token,
    };
  }

  async login(dto: { email: string; password: string }) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        adminScope: true,
        hostedWorkspaces: { select: { id: true, name: true, slug: true, city: true } },
        cohostPermissions: {
          include: {
            workspace: { select: { id: true, name: true, slug: true, city: true } },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.isBlocked) {
      throw new UnauthorizedException(`Account suspended: ${user.blockReason || 'Contact administration'}`);
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.generateToken(user);
    return {
      user: this.formatUserResponse(user),
      token,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        adminScope: true,
        hostedWorkspaces: { select: { id: true, name: true, slug: true, city: true } },
        cohostPermissions: {
          include: {
            workspace: { select: { id: true, name: true, slug: true, city: true } },
          },
        },
      },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.formatUserResponse(user);
  }

  formatUserResponse(user: any) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      companyName: user.companyName,
      gstin: user.gstin,
      billingAddress: user.billingAddress,
      adminScope: user.adminScope,
      hostedWorkspaces: user.hostedWorkspaces || [],
      cohostPermissions: user.cohostPermissions || [],
      createdAt: user.createdAt,
    };
  }

  private generateToken(user: { id: string; email: string; role: Role }) {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }
}
