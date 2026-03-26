import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { buildQueryParams } from "@/lib/api/query-utils";
import type { ApiResponse, PaginatedResult, PaginationParams } from "@/types/api";
import type { CreateStudentDto, UpdateStudentDto, UpsertPortalAccessDto } from "@/types/dto";
import type { Student, StudentDetail, StudentImportSummary, StudentPortalAccess } from "@/types/domain";

export const studentsApi = {
  list: (params: PaginationParams) =>
    unwrapResponse(
      apiClient.get<ApiResponse<PaginatedResult<Student>>>(`${endpoints.students.list}?${buildQueryParams(params).toString()}`),
    ),
  detail: (id: string) => unwrapResponse(apiClient.get<ApiResponse<StudentDetail>>(endpoints.students.detail(id))),
  create: (payload: CreateStudentDto) =>
    unwrapResponse(apiClient.post<ApiResponse<Student>>(endpoints.students.list, payload)),
  importCsv: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return unwrapResponse(
      apiClient.post<ApiResponse<StudentImportSummary>>(endpoints.students.import, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    );
  },
  downloadImportSample: async () => {
    const response = await apiClient.get<Blob>(endpoints.students.importSample, {
      responseType: "blob",
    });
    return response.data;
  },
  update: (id: string, payload: UpdateStudentDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<Student>>(endpoints.students.detail(id), payload)),
  portalAccess: (id: string) =>
    unwrapResponse(apiClient.get<ApiResponse<StudentPortalAccess>>(endpoints.students.portalAccess(id))),
  upsertPortalAccess: ({ id, payload }: { id: string; payload: UpsertPortalAccessDto }) =>
    unwrapResponse(apiClient.post<ApiResponse<StudentPortalAccess>>(endpoints.students.portalAccess(id), payload)),
  remove: (id: string) =>
    unwrapResponse(apiClient.delete<ApiResponse<{ deleted: boolean }>>(endpoints.students.detail(id))),
};
