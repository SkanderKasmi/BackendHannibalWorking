import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AgentsService } from './agents.service';
import { MESSAGE_PATTERNS } from '@app/common/constants';
import { DeployAgentDto, CreateTaskDto } from '@app/common/dto';

@Controller()
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @MessagePattern(MESSAGE_PATTERNS.AGENTS.DEPLOY_AGENT)
  async deployAgent(@Payload() dto: DeployAgentDto) {
    return this.agentsService.deployAgent(dto);
  }

  // @MessagePattern(MESSAGE_PATTERNS.AGENTS.GET_AGENTS)
  // async getAgents(@Payload() data: { vmId?: string }) {
  //   return this.agentsService.getAgents(data.vmId);
  // }

  @MessagePattern(MESSAGE_PATTERNS.AGENTS.GET_AGENT)
  async getAgent(@Payload() data: { id: string }) {
    return this.agentsService.getAgent(data.id);
  }

  @MessagePattern(MESSAGE_PATTERNS.AGENTS.CREATE_TASK)
  async createTask(@Payload() dto: CreateTaskDto) {
    return this.agentsService.createTask(dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.AGENTS.GET_TASKS)
  async getTasks(@Payload() data: { agentId: string }) {
    return this.agentsService.getTasks(data.agentId);
  }

  @MessagePattern(MESSAGE_PATTERNS.AGENTS.GET_AGENT_STATUS)
  async getAgentStatus(@Payload() data: { id: string }) {
    return this.agentsService.getAgentStatus(data.id);
  }
}
