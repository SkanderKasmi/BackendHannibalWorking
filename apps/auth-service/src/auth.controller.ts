import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { MESSAGE_PATTERNS } from '@app/common/constants';
import { LoginDto, SignupDto, CreatePermissionDto } from '@app/common/dto';
import { PermissionCheck } from '@app/common/interfaces';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(MESSAGE_PATTERNS.AUTH.LOGIN)
  async login(@Payload() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @MessagePattern(MESSAGE_PATTERNS.AUTH.SIGNUP)
  async signup(@Payload() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @MessagePattern(MESSAGE_PATTERNS.AUTH.VALIDATE_TOKEN)
  async validateToken(@Payload() data: { token: string }) {
    return this.authService.validateToken(data.token);
  }

  @MessagePattern(MESSAGE_PATTERNS.AUTH.GET_USER)
  async getUser(@Payload() data: { userId: string }) {
    return this.authService.getUser(data.userId);
  }

  @MessagePattern(MESSAGE_PATTERNS.AUTH.CHECK_PERMISSION)
  async checkPermission(@Payload() data: PermissionCheck) {
    return this.authService.checkPermission(data);
  }

  @MessagePattern('auth.create_permission')
  async createPermission(@Payload() data: CreatePermissionDto) {
    return this.authService.createPermission(data);
  }

  @MessagePattern('auth.get_users')
  async getUsers() {
    return this.authService.getUsers();
  }
}
