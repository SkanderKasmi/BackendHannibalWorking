import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum, IsArray, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  DEVELOPER = 'DEVELOPER',
  VIEWER = 'VIEWER',
}

export enum ResourceGroupType {
  LOCAL = 'LOCAL',
  AWS = 'AWS',
  AZURE = 'AZURE',
  GCP = 'GCP',
}

export enum VMStatus {
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
  PENDING = 'PENDING',
  ERROR = 'ERROR',
}

export enum ConnectionType {
  SSH = 'SSH',
  GRPC = 'GRPC',
  HTTPS = 'HTTPS',
}

export enum TaskType {
  PIPELINE = 'PIPELINE',
  ANSIBLE = 'ANSIBLE',
  SCRIPT = 'SCRIPT',
  COMMAND = 'COMMAND',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class LoginDto {
  @ApiProperty({ description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password' })
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class SignupDto {
  @ApiProperty({ description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ description: 'User full name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'User role', enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

export class CreateResourceGroupDto {
  @ApiProperty({ description: 'Name of the resource group' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the resource group' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Type of resource group', enum: ResourceGroupType })
  @IsOptional()
  @IsEnum(ResourceGroupType)
  type?: ResourceGroupType;

  @ApiPropertyOptional({ description: 'Provider name' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ description: 'Address of the resource group' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Credentials in JSON string format' })
  @IsOptional()
  @IsString()
  credentials?: string;
}

export class UpdateResourceGroupDto {
  @ApiPropertyOptional({ description: 'Name of the resource group' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the resource group' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateVMDto {
  @ApiProperty({ description: 'VM name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Resource group ID this VM belongs to' })
  @IsNotEmpty()
  @IsString()
  resourceGroupId: string;

  @ApiProperty({ description: 'Operating system of the VM' })
  @IsNotEmpty()
  @IsString()
  os: string;

  @ApiProperty({ description: 'Size of the VM' })
  @IsNotEmpty()
  @IsString()
  size: string;

  @ApiPropertyOptional({ description: 'IP address of the VM' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Connection type', enum: ConnectionType })
  @IsOptional()
  @IsEnum(ConnectionType)
  connectionType?: ConnectionType;

  @ApiPropertyOptional({ description: 'Credentials in string format' })
  @IsOptional()
  @IsString()
  credentials?: string;

  @ApiPropertyOptional({ description: 'Public key for SSH' })
  @IsOptional()
  @IsString()
  publicKey?: string;
}

export class UpdateVMDto {
  @ApiPropertyOptional({ description: 'VM name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Operating system' })
  @IsOptional()
  @IsString()
  os?: string;

  @ApiPropertyOptional({ description: 'VM size' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ description: 'VM status', enum: VMStatus })
  @IsOptional()
  @IsEnum(VMStatus)
  status?: VMStatus;

  @ApiPropertyOptional({ description: 'IP address' })
  @IsOptional()
  @IsString()
  ipAddress?: string;
}

export class ExecuteCommandDto {
  @ApiProperty({ description: 'VM ID' })
  @IsNotEmpty()
  @IsString()
  vmId: string;

  @ApiProperty({ description: 'Command to execute' })
  @IsNotEmpty()
  @IsString()
  command: string;
}

export class CreateVirtualNetworkDto {
  @ApiProperty({ description: 'Virtual network name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Resource group ID' })
  @IsNotEmpty()
  @IsString()
  resourceGroupId: string;

  @ApiProperty({ description: 'CIDR block' })
  @IsNotEmpty()
  @IsString()
  cidr: string;

  @ApiPropertyOptional({ description: 'Subnets in JSON format' })
  @IsOptional()
  subnets?: any;
}

export class UpdateVirtualNetworkDto {
  @ApiPropertyOptional({ description: 'Virtual network name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'CIDR block' })
  @IsOptional()
  @IsString()
  cidr?: string;

  @ApiPropertyOptional({ description: 'Subnets in JSON format' })
  @IsOptional()
  subnets?: any;
}

export class DeployAgentDto {
  @ApiProperty({ description: 'VM ID where agent will be deployed' })
  @IsNotEmpty()
  @IsString()
  vmId: string;
}

export class CreateTaskDto {
  @ApiProperty({ description: 'Agent ID' })
  @IsNotEmpty()
  @IsString()
  agentId: string;

  @ApiProperty({ description: 'Task type', enum: TaskType })
  @IsNotEmpty()
  @IsEnum(TaskType)
  type: TaskType;

  @ApiPropertyOptional({ description: 'Command to execute' })
  @IsOptional()
  @IsString()
  command?: string;

  @ApiPropertyOptional({ description: 'Script to run' })
  @IsOptional()
  @IsString()
  script?: string;
}

export class CreatePermissionDto {
  @ApiProperty({ description: 'User ID' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Resource group ID' })
  @IsNotEmpty()
  @IsString()
  resourceGroupId: string;

  @ApiProperty({ description: 'Actions allowed', type: [String] })
  @IsArray()
  @IsString({ each: true })
  actions: string[];
}

export class PaginationDto {
  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
