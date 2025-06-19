import { Injectable } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';
import { ApiResponseService } from '../shared/api-response.services';
import { UpdateUserDto } from './dtos/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaClient,
    private apiResponse: ApiResponseService,
  ) {}

  async getProfile(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          lastLogin: true,
          status: true,
        },
      });

      if (!user) {
        return this.apiResponse.notFound('User not found');
      }

      return this.apiResponse.ok(
        user,
        'User profile retrieved successfully',
        '', // redirectUrl (empty if not needed)
        user, // data
      );
    } catch (error) {
      return this.apiResponse.error(
        'Failed to retrieve user profile',
        500,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return this.apiResponse.notFound('User not found');
      }

      // Check if email is being updated and is already taken
      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUser = await this.prisma.user.findUnique({
          where: { email: updateUserDto.email },
        });

        if (existingUser) {
          return this.apiResponse.badRequest('Email already in use');
        }
      }

      // If password is provided, hash it
      const updatedData = { ...updateUserDto };
      if (updateUserDto.password) {
        updatedData.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: updatedData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          lastLogin: true,
        },
      });

      return this.apiResponse.ok(
        updatedUser,
        'User profile updated successfully',
        '', // redirectUrl
        updatedUser, // data
      );
    } catch (error) {
      return this.apiResponse.error(
        'Failed to update user profile',
        500,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async softDeleteAccount(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return this.apiResponse.notFound('User not found');
      }

      // Perform soft delete by updating status
      await this.prisma.user.update({
        where: { id: userId },
        data: { status: 'INACTIVE' },
      });

      return this.apiResponse.ok(
        null,
        'Account deactivated successfully',
        '', // redirectUrl
        null, // data
      );
    } catch (error) {
      return this.apiResponse.error(
        'Failed to deactivate account',
        500,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
