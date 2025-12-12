export const AUTH_SERVICE = 'AUTH_SERVICE';
export const INFRASTRUCTURE_SERVICE = 'INFRASTRUCTURE_SERVICE';
export const AGENTS_SERVICE = 'AGENTS_SERVICE';
export const MONITOR_SERVICE = 'MONITOR_SERVICE';

export const AUTH_SERVICE_PORT = 3001;
export const INFRASTRUCTURE_SERVICE_PORT = 3002;
export const AGENTS_SERVICE_PORT = 3003;
export const MONITOR_SERVICE_PORT = 3004;
export const API_GATEWAY_PORT = 5000;

// Use Docker service names when running in Docker, localhost otherwise
const isDocker = process.env.NODE_ENV === 'docker' || process.env.DOCKER_HOST !== undefined;
const hostAuth = isDocker ? 'auth-service' : '127.0.0.1';
const hostInfra = isDocker ? 'infrastructure-service' : '127.0.0.1';
const hostAgents = isDocker ? 'agents-service' : '127.0.0.1';
const hostMonitor = isDocker ? 'monitor-service' : '127.0.0.1';

export const TCP_OPTIONS = {
  auth: { host: hostAuth, port: AUTH_SERVICE_PORT },
  infrastructure: { host: hostInfra, port: INFRASTRUCTURE_SERVICE_PORT },
  agents: { host: hostAgents, port: AGENTS_SERVICE_PORT },
  monitor: { host: hostMonitor, port: MONITOR_SERVICE_PORT },
};

export const MESSAGE_PATTERNS = {
  AUTH: {
    LOGIN: 'auth.login',
    SIGNUP: 'auth.signup',
    VALIDATE_TOKEN: 'auth.validate_token',
    GET_USER: 'auth.get_user',
    CHECK_PERMISSION: 'auth.check_permission',
  },
  INFRASTRUCTURE: {
    CREATE_RESOURCE_GROUP: 'infra.create_resource_group',
    GET_RESOURCE_GROUPS: 'infra.get_resource_groups',
    GET_RESOURCE_GROUP: 'infra.get_resource_group',
    UPDATE_RESOURCE_GROUP: 'infra.update_resource_group',
    DELETE_RESOURCE_GROUP: 'infra.delete_resource_group',
    CREATE_VM: 'infra.create_vm',
    GET_VMS: 'infra.get_vms',
    GET_VM: 'infra.get_vm',
    UPDATE_VM: 'infra.update_vm',
    DELETE_VM: 'infra.delete_vm',
    EXECUTE_COMMAND: 'infra.execute_command',
    CREATE_VIRTUAL_NETWORK: 'infra.create_virtual_network',
    GET_VIRTUAL_NETWORKS: 'infra.get_virtual_networks',
    UPDATE_VIRTUAL_NETWORK: 'infra.update_virtual_network',
    DELETE_VIRTUAL_NETWORK: 'infra.delete_virtual_network',
    VM_CONNECTIVITY_UPDATE: 'infra.vm_connectivity_update',
  },
  AGENTS: {
    DEPLOY_AGENT: 'agents.deploy',
    GET_AGENTS: 'agents.get_all',
    GET_AGENT: 'agents.get',
    CREATE_TASK: 'agents.create_task',
    GET_TASKS: 'agents.get_tasks',
    GET_AGENT_STATUS: 'agents.get_status',
  },
  MONITOR: {
    GET_HEALTH: 'monitor.get_health',
    GET_VM_METRICS: 'monitor.get_vm_metrics',
    GET_RESOURCE_GROUP_STATS: 'monitor.get_rg_stats',
    RECORD_METRIC: 'monitor.record_metric',
  },
};

export const AGENT_SCRIPT_FILES = {
  PRODUCER: 'producer.sh',
  CONNECTIVITY: 'connectivity.sh',
  AGENTS: 'agents.sh',
};

export const RABBITMQ_ROUTING_KEYS = {
  AGENTS_DEPLOY_SCRIPTS: 'agents.deploy_scripts',
  INFRASTRUCTURE_VM_STATUS: 'infrastructure.vm.status',
};
