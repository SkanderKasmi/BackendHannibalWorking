import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InfrastructureService } from './infrastructure.service';
import { MESSAGE_PATTERNS } from '@app/common/constants';
import {
  CreateResourceGroupDto,
  UpdateResourceGroupDto,
  CreateVMDto,
  UpdateVMDto,
  ExecuteCommandDto,
  CreateVirtualNetworkDto,
  UpdateVirtualNetworkDto,
} from '@app/common/dto';

@Controller()
export class InfrastructureController {
  constructor(private readonly infrastructureService: InfrastructureService) {}

  @MessagePattern(MESSAGE_PATTERNS.INFRASTRUCTURE.CREATE_RESOURCE_GROUP)
  async createResourceGroup(@Payload() dto: CreateResourceGroupDto) {
    return this.infrastructureService.createResourceGroup(dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.INFRASTRUCTURE.GET_RESOURCE_GROUPS)
  async getResourceGroups() {
    return this.infrastructureService.getResourceGroups();
  }

  @MessagePattern(MESSAGE_PATTERNS.INFRASTRUCTURE.GET_RESOURCE_GROUP)
  async getResourceGroup(@Payload() data: { id: string }) {
    return this.infrastructureService.getResourceGroup(data.id);
  }

  @MessagePattern(MESSAGE_PATTERNS.INFRASTRUCTURE.UPDATE_RESOURCE_GROUP)
  async updateResourceGroup(@Payload() data: { id: string; dto: UpdateResourceGroupDto }) {
    return this.infrastructureService.updateResourceGroup(data.id, data.dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.INFRASTRUCTURE.DELETE_RESOURCE_GROUP)
  async deleteResourceGroup(@Payload() data: { id: string }) {
    return this.infrastructureService.deleteResourceGroup(data.id);
  }

  @MessagePattern(MESSAGE_PATTERNS.INFRASTRUCTURE.CREATE_VM)
  async createVM(@Payload() dto: CreateVMDto) {
    return this.infrastructureService.createVM(dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.INFRASTRUCTURE.GET_VMS)
  async getVMs(@Payload() data: { resourceGroupId?: string }) {
    return this.infrastructureService.getVMs(data.resourceGroupId);
  }

  @MessagePattern(MESSAGE_PATTERNS.INFRASTRUCTURE.GET_VM)
  async getVM(@Payload() data: { id: string }) {
    return this.infrastructureService.getVM(data.id);
  }

  @MessagePattern(MESSAGE_PATTERNS.INFRASTRUCTURE.UPDATE_VM)
  async updateVM(@Payload() data: { id: string; dto: UpdateVMDto }) {
    return this.infrastructureService.updateVM(data.id, data.dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.INFRASTRUCTURE.DELETE_VM)
  async deleteVM(@Payload() data: { id: string }) {
    return this.infrastructureService.deleteVM(data.id);
  }

  @MessagePattern(MESSAGE_PATTERNS.INFRASTRUCTURE.EXECUTE_COMMAND)
  async executeCommand(@Payload() dto: ExecuteCommandDto) {
    return this.infrastructureService.executeCommand(dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.INFRASTRUCTURE.CREATE_VIRTUAL_NETWORK)
  async createVirtualNetwork(@Payload() dto: CreateVirtualNetworkDto) {
    return this.infrastructureService.createVirtualNetwork(dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.INFRASTRUCTURE.GET_VIRTUAL_NETWORKS)
  async getVirtualNetworks(@Payload() data: { resourceGroupId?: string }) {
    return this.infrastructureService.getVirtualNetworks(data.resourceGroupId);
  }

  @MessagePattern(MESSAGE_PATTERNS.INFRASTRUCTURE.UPDATE_VIRTUAL_NETWORK)
  async updateVirtualNetwork(@Payload() data: { id: string; dto: UpdateVirtualNetworkDto }) {
    return this.infrastructureService.updateVirtualNetwork(data.id, data.dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.INFRASTRUCTURE.DELETE_VIRTUAL_NETWORK)
  async deleteVirtualNetwork(@Payload() data: { id: string }) {
    return this.infrastructureService.deleteVirtualNetwork(data.id);
  }
}
