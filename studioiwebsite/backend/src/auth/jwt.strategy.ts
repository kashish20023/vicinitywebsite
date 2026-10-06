import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'studioi_jwt_secret_coworking_production_grade_key_2026',
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
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
      throw new UnauthorizedException('User no longer exists');
    }
    if (user.isBlocked) {
      throw new UnauthorizedException('User account is suspended');
    }
    return user;
  }
}
