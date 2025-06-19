import { Body, Controller, Post, HttpCode, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './dto/reset-password.dto';
import { RoleGuard } from './guards/role-guard/role-guard.guard';
import { Roles } from './decorators/role.decorator';
import { JwtAuthGuard } from './guards/jwt-guard/jwt-guard.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('password-reset/request')
  @HttpCode(200)
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('password-reset/reset')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('admin/create')
  @UseGuards(RoleGuard, JwtAuthGuard)
  @Roles('ADMIN')
  @HttpCode(201)
  async createAdmin(@Body() adminData: RegisterDto) {
    return this.authService.createAdmin(adminData);
  }
}
