import { Controller, Post, Get, Body, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AUTH_SERVICE, MESSAGE_PATTERNS } from '@app/common/constants';
import { LoginDto, SignupDto, CreatePermissionDto } from '@app/common/dto';
import { Public, CurrentUser, Roles } from '@app/common/decorators';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, } from '@nestjs/swagger';
import { AuthResponse, ServiceResponse } from '@app/common/interfaces';

@ApiTags('Auth')

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    try {
      const result: ServiceResponse<AuthResponse> = await firstValueFrom(
        this.authClient.send(MESSAGE_PATTERNS.AUTH.LOGIN, loginDto),
      );

      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.UNAUTHORIZED);
      }

      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Login failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: SignupDto })

  async signup(@Body() signupDto: SignupDto): Promise<AuthResponse> {
    try {
      const result: ServiceResponse<AuthResponse> = await firstValueFrom(
        this.authClient.send(MESSAGE_PATTERNS.AUTH.SIGNUP, signupDto),
      );

      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
      }

      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Signup failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })

  async getProfile(@CurrentUser('sub') userId: string): Promise<AuthResponse> {
    try {
      const result: ServiceResponse<AuthResponse> = await firstValueFrom(
        this.authClient.send(MESSAGE_PATTERNS.AUTH.GET_USER, { userId }),
      );

      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.NOT_FOUND);
      }

      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to get profile', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Roles('ADMIN')
  @Get('users')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (admin only)' })

  async getUsers(): Promise<AuthResponse[]> {
    try {
      const result: ServiceResponse<AuthResponse[]> = await firstValueFrom(
        this.authClient.send('auth.get_users', {}),
      );

      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to get users', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Roles('ADMIN')
  @Post('permissions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create permissions for a user on a resource group' })
  @ApiBody({ type: CreatePermissionDto })
  @ApiResponse({ status: 201, description: 'Permission created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createPermission(@Body() dto: CreatePermissionDto) {
    try {
      const result: ServiceResponse<any> = await firstValueFrom(
        this.authClient.send('auth.create_permission', dto),
      );

      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
      }

      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to create permission', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
