import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { INFRASTRUCTURE_SERVICE, MESSAGE_PATTERNS } from '@app/common/constants';
import {
  CreateResourceGroupDto,
  UpdateResourceGroupDto,
  CreateVMDto,
  UpdateVMDto,
  ExecuteCommandDto,
  CreateVirtualNetworkDto,
  UpdateVirtualNetworkDto,
} from '@app/common/dto';
import { Roles } from '@app/common/decorators';
import { ApiTags, ApiBody, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('infrastructure')
@ApiBearerAuth()
@Controller('infrastructure')
export class InfrastructureController {
  constructor(
    @Inject(INFRASTRUCTURE_SERVICE) private readonly infraClient: ClientProxy,
  ) {}

  @Post('resource-groups')
  @ApiOperation({ summary: 'Create a resource group' })
  @ApiBody({ type: CreateResourceGroupDto })
  @ApiResponse({ status: 201, description: 'Resource group created' })
  async createResourceGroup(@Body() dto: CreateResourceGroupDto) {
    try {
      const result = await firstValueFrom(
        this.infraClient.send(MESSAGE_PATTERNS.INFRASTRUCTURE.CREATE_RESOURCE_GROUP, dto),
      );

      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
      }
      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to create resource group', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('resource-groups')
  @ApiOperation({ summary: 'Get all resource groups' })
  @ApiResponse({ status: 200, description: 'List of resource groups' })
  async getResourceGroups() {
    try {
      const result = await firstValueFrom(
        this.infraClient.send(MESSAGE_PATTERNS.INFRASTRUCTURE.GET_RESOURCE_GROUPS, {}),
      );
      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.INTERNAL_SERVER_ERROR);
      }
      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to get resource groups', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('resource-groups/:id')
  @ApiOperation({ summary: 'Get a resource group by ID' })
  @ApiResponse({ status: 200, description: 'Resource group data' })
  @ApiResponse({ status: 404, description: 'Resource group not found' })
  async getResourceGroup(@Param('id') id: string) {
    try {
      const result = await firstValueFrom(
        this.infraClient.send(MESSAGE_PATTERNS.INFRASTRUCTURE.GET_RESOURCE_GROUP, { id }),
      );
      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.NOT_FOUND);
      }
      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to get resource group', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('resource-groups/:id')
  @ApiOperation({ summary: 'Update a resource group' })
  @ApiBody({ type: UpdateResourceGroupDto })
  @ApiResponse({ status: 200, description: 'Resource group updated' })
  async updateResourceGroup(@Param('id') id: string, @Body() dto: UpdateResourceGroupDto) {
    try {
      const result = await firstValueFrom(
        this.infraClient.send(MESSAGE_PATTERNS.INFRASTRUCTURE.UPDATE_RESOURCE_GROUP, { id, dto }),
      );
      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
      }
      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to update resource group', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Roles('ADMIN', 'MANAGER')
  @Delete('resource-groups/:id')
  @ApiOperation({ summary: 'Delete a resource group' })
  @ApiResponse({ status: 200, description: 'Resource group deleted' })
  async deleteResourceGroup(@Param('id') id: string) {
    try {
      const result = await firstValueFrom(
        this.infraClient.send(MESSAGE_PATTERNS.INFRASTRUCTURE.DELETE_RESOURCE_GROUP, { id }),
      );
      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
      }
      return { message: 'Resource group deleted successfully' };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to delete resource group', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('vms')
  @ApiOperation({ summary: 'Create a VM' })
  @ApiBody({ type: CreateVMDto })
  @ApiResponse({ status: 201, description: 'VM created' })
  async createVM(@Body() dto: CreateVMDto) {
    try {
      const result = await firstValueFrom(
        this.infraClient.send(MESSAGE_PATTERNS.INFRASTRUCTURE.CREATE_VM, dto),
      );
      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
      }
      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to create VM', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('vms')
  @ApiOperation({ summary: 'Get all VMs' })
  @ApiResponse({ status: 200, description: 'List of VMs' })
  async getVMs(@Query('resourceGroupId') resourceGroupId?: string) {
    try {
      const result = await firstValueFrom(
        this.infraClient.send(MESSAGE_PATTERNS.INFRASTRUCTURE.GET_VMS, { resourceGroupId }),
      );
      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.INTERNAL_SERVER_ERROR);
      }
      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to get VMs', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('vms/:id')
  @ApiOperation({ summary: 'Get a VM by ID' })
  @ApiResponse({ status: 200, description: 'VM data' })
  @ApiResponse({ status: 404, description: 'VM not found' })
  async getVM(@Param('id') id: string) {
    try {
      const result = await firstValueFrom(
        this.infraClient.send(MESSAGE_PATTERNS.INFRASTRUCTURE.GET_VM, { id }),
      );
      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.NOT_FOUND);
      }
      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to get VM', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('vms/:id')
  @ApiOperation({ summary: 'Update a VM' })
  @ApiBody({ type: UpdateVMDto })
  @ApiResponse({ status: 200, description: 'VM updated' })
  async updateVM(@Param('id') id: string, @Body() dto: UpdateVMDto) {
    try {
      const result = await firstValueFrom(
        this.infraClient.send(MESSAGE_PATTERNS.INFRASTRUCTURE.UPDATE_VM, { id, dto }),
      );
      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
      }
      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to update VM', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Roles('ADMIN', 'MANAGER')
  @Delete('vms/:id')
  @ApiOperation({ summary: 'Delete a VM' })
  @ApiResponse({ status: 200, description: 'VM deleted' })
  async deleteVM(@Param('id') id: string) {
    try {
      const result = await firstValueFrom(
        this.infraClient.send(MESSAGE_PATTERNS.INFRASTRUCTURE.DELETE_VM, { id }),
      );
      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
      }
      return { message: 'VM deleted successfully' };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to delete VM', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('vms/execute')
  @ApiOperation({ summary: 'Execute command on VM' })
  @ApiBody({ type: ExecuteCommandDto })
  @ApiResponse({ status: 200, description: 'Command executed' })
  async executeCommand(@Body() dto: ExecuteCommandDto) {
    try {
      const result = await firstValueFrom(
        this.infraClient.send(MESSAGE_PATTERNS.INFRASTRUCTURE.EXECUTE_COMMAND, dto),
      );
      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
      }
      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to execute command', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('virtual-networks')
  @ApiOperation({ summary: 'Create a virtual network' })
  @ApiBody({ type: CreateVirtualNetworkDto })
  @ApiResponse({ status: 201, description: 'Virtual network created' })
  async createVirtualNetwork(@Body() dto: CreateVirtualNetworkDto) {
    try {
      const result = await firstValueFrom(
        this.infraClient.send(MESSAGE_PATTERNS.INFRASTRUCTURE.CREATE_VIRTUAL_NETWORK, dto),
      );
      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
      }
      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to create virtual network', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('virtual-networks')
  @ApiOperation({ summary: 'Get all virtual networks' })
  @ApiResponse({ status: 200, description: 'List of virtual networks' })
  async getVirtualNetworks(@Query('resourceGroupId') resourceGroupId?: string) {
    try {
      const result = await firstValueFrom(
        this.infraClient.send(MESSAGE_PATTERNS.INFRASTRUCTURE.GET_VIRTUAL_NETWORKS, { resourceGroupId }),
      );
      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.INTERNAL_SERVER_ERROR);
      }
      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to get virtual networks', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('virtual-networks/:id')
  @ApiOperation({ summary: 'Update a virtual network' })
  @ApiBody({ type: UpdateVirtualNetworkDto })
  @ApiResponse({ status: 200, description: 'Virtual network updated' })
  async updateVirtualNetwork(@Param('id') id: string, @Body() dto: UpdateVirtualNetworkDto) {
    try {
      const result = await firstValueFrom(
        this.infraClient.send(MESSAGE_PATTERNS.INFRASTRUCTURE.UPDATE_VIRTUAL_NETWORK, { id, dto }),
      );
      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
      }
      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to update virtual network', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Roles('ADMIN', 'MANAGER')
  @Delete('virtual-networks/:id')
  @ApiOperation({ summary: 'Delete a virtual network' })
  @ApiResponse({ status: 200, description: 'Virtual network deleted' })
  async deleteVirtualNetwork(@Param('id') id: string) {
    try {
      const result = await firstValueFrom(
        this.infraClient.send(MESSAGE_PATTERNS.INFRASTRUCTURE.DELETE_VIRTUAL_NETWORK, { id }),
      );
      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
      }
      return { message: 'Virtual network deleted successfully' };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to delete virtual network', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
