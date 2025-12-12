import { Injectable } from '@nestjs/common';
import {
  CreateResourceGroupDto,
  UpdateResourceGroupDto,
  CreateVMDto,
  UpdateVMDto,
  ExecuteCommandDto,
  CreateVirtualNetworkDto,
  UpdateVirtualNetworkDto,
  ResourceGroupType,
  VMStatus,
} from '@app/common/dto';
import { ServiceResponse } from '@app/common/interfaces';
import { PrismaService } from './prisma.service';

@Injectable()
export class InfrastructureService {
  constructor(private readonly prisma: PrismaService) {}

  async createResourceGroup(dto: CreateResourceGroupDto): Promise<ServiceResponse<any>> {
    try {
      const resourceGroup = await this.prisma.resourceGroup.create({
        data: {
          name: dto.name,
          description: dto.description,
          type: dto.type || ResourceGroupType.LOCAL,
          provider: dto.provider,
          address: dto.address,
          credentials: dto.credentials,
        },
      });

      return { success: true, data: resourceGroup };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getResourceGroups(): Promise<ServiceResponse<any[]>> {
    try {
      const resourceGroups = await this.prisma.resourceGroup.findMany({
        include: {
          virtualMachines: true,
          virtualNetworks: true,
        },
      });

      return { success: true, data: resourceGroups };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getResourceGroup(id: string): Promise<ServiceResponse<any>> {
    try {
      const resourceGroup = await this.prisma.resourceGroup.findUnique({
        where: { id },
        include: {
          virtualMachines: true,
          virtualNetworks: true,
        },
      });

      if (!resourceGroup) {
        return { success: false, error: 'Resource group not found' };
      }

      return { success: true, data: resourceGroup };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateResourceGroup(id: string, dto: UpdateResourceGroupDto): Promise<ServiceResponse<any>> {
    try {
      const resourceGroup = await this.prisma.resourceGroup.update({
        where: { id },
        data: dto,
      });

      return { success: true, data: resourceGroup };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteResourceGroup(id: string): Promise<ServiceResponse<any>> {
    try {
      await this.prisma.resourceGroup.delete({
        where: { id },
      });

      return { success: true, message: 'Resource group deleted successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createVM(dto: CreateVMDto): Promise<ServiceResponse<any>> {
    try {
      const resourceGroup = await this.prisma.resourceGroup.findUnique({
        where: { id: dto.resourceGroupId },
      });

      if (!resourceGroup) {
        return { success: false, error: 'Resource group not found' };
      }

      const vm = await this.prisma.virtualMachine.create({
        data: {
          name: dto.name,
          resourceGroupId: dto.resourceGroupId,
          os: dto.os,
          size: dto.size,
          status: VMStatus.PENDING,
          ip: dto.ipAddress,
          connectionType: dto.connectionType,
          credentials: dto.credentials,
          publicKey: dto.publicKey,
        },
      });

      return { success: true, data: vm };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getVMs(resourceGroupId?: string): Promise<ServiceResponse<any[]>> {
    try {
      const where = resourceGroupId ? { resourceGroupId } : {};
      const vms = await this.prisma.virtualMachine.findMany({
        where,
        include: {
          resourceGroup: {
            select: { id: true, name: true },
          },
          agents: true,
        },
      });

      return { success: true, data: vms };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getVM(id: string): Promise<ServiceResponse<any>> {
    try {
      const vm = await this.prisma.virtualMachine.findUnique({
        where: { id },
        include: {
          resourceGroup: true,
          agents: true,
          metrics: {
            orderBy: { timestamp: 'desc' },
            take: 10,
          },
        },
      });

      if (!vm) {
        return { success: false, error: 'VM not found' };
      }

      return { success: true, data: vm };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateVM(id: string, dto: UpdateVMDto): Promise<ServiceResponse<any>> {
    try {
      const vm = await this.prisma.virtualMachine.update({
        where: { id },
        data: dto,
      });

      return { success: true, data: vm };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteVM(id: string): Promise<ServiceResponse<any>> {
    try {
      await this.prisma.virtualMachine.delete({
        where: { id },
      });

      return { success: true, message: 'VM deleted successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async executeCommand(dto: ExecuteCommandDto): Promise<ServiceResponse<any>> {
    try {
      const vm = await this.prisma.virtualMachine.findUnique({
        where: { id: dto.vmId },
      });

      if (!vm) {
        return { success: false, error: 'VM not found' };
      }

      if (vm.status !== VMStatus.RUNNING) {
        return { success: false, error: 'VM is not running' };
      }

      return {
        success: true,
        data: {
          vmId: dto.vmId,
          command: dto.command,
          status: 'queued',
          message: 'Command queued for execution',
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createVirtualNetwork(dto: CreateVirtualNetworkDto): Promise<ServiceResponse<any>> {
    try {
      const resourceGroup = await this.prisma.resourceGroup.findUnique({
        where: { id: dto.resourceGroupId },
      });

      if (!resourceGroup) {
        return { success: false, error: 'Resource group not found' };
      }

      const virtualNetwork = await this.prisma.virtualNetwork.create({
        data: {
          name: dto.name,
          resourceGroupId: dto.resourceGroupId,
          cidr: dto.cidr,
          subnets: dto.subnets,
          status: 'NOT_READY',
        },
      });

      return { success: true, data: virtualNetwork };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getVirtualNetworks(resourceGroupId?: string): Promise<ServiceResponse<any[]>> {
    try {
      const where = resourceGroupId ? { resourceGroupId } : {};
      const virtualNetworks = await this.prisma.virtualNetwork.findMany({
        where,
        include: {
          resourceGroup: {
            select: { id: true, name: true },
          },
        },
      });

      return { success: true, data: virtualNetworks };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateVirtualNetwork(id: string, dto: UpdateVirtualNetworkDto): Promise<ServiceResponse<any>> {
    try {
      const virtualNetwork = await this.prisma.virtualNetwork.update({
        where: { id },
        data: dto,
      });

      return { success: true, data: virtualNetwork };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteVirtualNetwork(id: string): Promise<ServiceResponse<any>> {
    try {
      await this.prisma.virtualNetwork.delete({
        where: { id },
      });

      return { success: true, message: 'Virtual network deleted successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
