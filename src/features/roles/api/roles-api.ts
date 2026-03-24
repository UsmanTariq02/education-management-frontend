import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { CreateRoleDto, UpdateRoleDto } from "@/types/dto";
import type { Role, Permission } from "@/types/domain";

export const rolesApi = {
  list: () => unwrapResponse(apiClient.get<ApiResponse<Role[]>>(endpoints.roles.list)),
  detail: (id: string) => unwrapResponse(apiClient.get<ApiResponse<Role>>(endpoints.roles.detail(id))),
  create: (payload: CreateRoleDto) => unwrapResponse(apiClient.post<ApiResponse<Role>>(endpoints.roles.list, payload)),
  update: (id: string, payload: UpdateRoleDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<Role>>(endpoints.roles.detail(id), payload)),
  permissions: () => unwrapResponse(apiClient.get<ApiResponse<Permission[]>>(endpoints.permissions.list)),
};
