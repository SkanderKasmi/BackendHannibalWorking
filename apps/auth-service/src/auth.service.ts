import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto, SignupDto, CreatePermissionDto, Role } from '@app/common/dto';
import { AuthResponse, JwtPayload, PermissionCheck, ServiceResponse } from '@app/common/interfaces';
import { PrismaService } from './prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<ServiceResponse<AuthResponse>> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: loginDto.email },
      });

      if (!user) {
        return { success: false, error: 'Invalid credentials' };
      }

      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      if (!isPasswordValid) {
        return { success: false, error: 'Invalid credentials' };
      }

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(payload);

      return {
        success: true,
        data: {
          accessToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async signup(signupDto: SignupDto): Promise<ServiceResponse<AuthResponse>> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: signupDto.email },
      });

      if (existingUser) {
        return { success: false, error: 'Email already exists' };
      }

      const hashedPassword = await bcrypt.hash(signupDto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          email: signupDto.email,
          password: hashedPassword,
          name: signupDto.name,
          role: signupDto.role || Role.DEVELOPER,
        },
      });

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(payload);

      return {
        success: true,
        data: {
          accessToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    }
  }

  async validateToken(token: string): Promise<ServiceResponse<JwtPayload>> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      return { success: true, data: payload };
    } catch (error) {
      return { success: false, error: 'Invalid token' };
    }
  }

  async getUser(userId: string): Promise<ServiceResponse<any>> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getUsers(): Promise<ServiceResponse<any[]>> {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      return { success: true, data: users };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async checkPermission(data: PermissionCheck): Promise<ServiceResponse<boolean>> {
    try {
      // Simple permission check based on role for now
      // In a real scenario, you would query a permissions table
      if (data.action === 'admin') {
        const user = await this.prisma.user.findUnique({
          where: { id: data.userId },
        });
        return { success: true, data: user?.role === Role.ADMIN };
      }

      return { success: true, data: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createPermission(data: CreatePermissionDto): Promise<ServiceResponse<any>> {
    try {
      // Note: The current schema doesn't support per-user permissions
      // This creates a named permission that could be used for RBAC
      const permission = await this.prisma.permission.create({
        data: {
          name: `${data.userId}-${data.resourceGroupId}`,
        },
      });

      return { success: true, data: permission };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
