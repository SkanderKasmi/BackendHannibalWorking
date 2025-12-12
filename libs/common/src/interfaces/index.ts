export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface PermissionCheck {
  userId: string;
  resourceGroupId: string;
  action: string;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface VMMetrics {
  vmId: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  timestamp: Date;
}

export interface ResourceGroupStats {
  id: string;
  name: string;
  totalVMs: number;
  runningVMs: number;
  stoppedVMs: number;
  errorVMs: number;
}
