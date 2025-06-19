import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from 'generated/prisma';
import { ApiResponseService } from '../shared/api-response.services';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './dto/reset-password.dto';
import { LoginResponse } from './interfaces/login.interfaces';
import { RegisterResponse } from './interfaces/register.interfaces';
import {
  RequestResetResponse,
  ResetPasswordResponse,
} from './interfaces/reset-password.interfaces';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private jwtService: JwtService,
    private apiResponse: ApiResponseService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: registerDto.email },
      });

      if (existingUser) {
        return this.apiResponse.badRequest(
          'User with this email already exists',
        );
      }

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          email: registerDto.email,
          name: registerDto.name,
          password: hashedPassword,
          role: 'USER',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      const response: RegisterResponse = {
        id: user.id,
        email: user.email,
        name: user.name ?? '',
        role: user.role,
        createdAt: user.createdAt,
      };

      return this.apiResponse.created(response, 'User registered successfully');
    } catch (error) {
      return this.apiResponse.error(
        'Failed to register user',
        500,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: loginDto.email },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          role: true,
          status: true,
        },
      });

      if (!user) {
        return this.apiResponse.unauthorized('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password,
      );

      if (!isPasswordValid) {
        return this.apiResponse.unauthorized('Invalid credentials');
      }

      if (user.status !== 'ACTIVE') {
        return this.apiResponse.unauthorized('Your account is not active');
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      const payload = { email: user.email, sub: user.id, role: user.role };
      const token = this.jwtService.sign(payload);

      const redirectUrl =
        user.role === 'ADMIN' ? '/admin/dashboard' : '/customer/shop';

      const response: LoginResponse = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name ?? '',
          role: user.role,
        },
        token,
      };
      return this.apiResponse.ok(
        response,
        'Login successful',
        redirectUrl,
        response,
      );
    } catch (error) {
      return this.apiResponse.error(
        'Login failed',
        500,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (!user) {
        return this.apiResponse.badRequest('No user found with this email');
      }

      const resetToken = randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      const response: RequestResetResponse = {
        message: 'Password reset instructions sent to your email',
        // Only include token in development environments
        ...(process.env.NODE_ENV !== 'production' && { token: resetToken }),
      };

      return this.apiResponse.okRequestReset(
        response,
        'Password reset token generated',
        '/login',
        response,
      );
    } catch (error) {
      return this.apiResponse.error(
        'Failed to request password reset',
        500,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    try {
      // Find user by reset token
      const user = await this.prisma.user.findFirst({
        where: {
          resetToken: dto.token,
          resetTokenExpiry: {
            gt: new Date(),
          },
        },
      });

      if (!user) {
        return this.apiResponse.badRequest('Invalid or expired token');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // Update user password and clear reset token
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      const response: ResetPasswordResponse = {
        message: 'Password updated successfully',
      };

      return this.apiResponse.ok(
        response,
        'Password updated successfully',
        '/login',
        response,
      );
    } catch (error) {
      return this.apiResponse.error(
        'Failed to reset password',
        500,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  // Method to create an admin account (can be used for seeding)
  async createAdmin(adminData: RegisterDto) {
    try {
      // Check if admin already exists
      const existingAdmin = await this.prisma.user.findUnique({
        where: { email: adminData.email },
      });

      if (existingAdmin) {
        return this.apiResponse.badRequest(
          'Admin with this email already exists',
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(adminData.password, 10);

      // Create admin user
      const admin = await this.prisma.user.create({
        data: {
          email: adminData.email,
          name: adminData.name || 'Admin',
          password: hashedPassword,
          role: 'ADMIN', // Admin role
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      const response: RegisterResponse = {
        id: admin.id,
        email: admin.email,
        name: admin.name ?? '',
        role: admin.role,
        createdAt: admin.createdAt,
      };

      return this.apiResponse.created(
        response,
        'Admin registered successfully',
      );
    } catch (error) {
      return this.apiResponse.error(
        'Failed to create admin account',
        500,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
