import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { CreateStudentDocumentDto } from "@/types/dto";
import type { StudentDocument } from "@/types/domain";

export const studentDocumentsApi = {
  list: (studentId: string) =>
    unwrapResponse(apiClient.get<ApiResponse<StudentDocument[]>>(endpoints.students.documents(studentId))),
  upload: async ({ studentId, payload, file }: { studentId: string; payload: CreateStudentDocumentDto; file: File }) => {
    const formData = new FormData();
    formData.append("title", payload.title);
    formData.append("type", payload.type);
    if (payload.notes) formData.append("notes", payload.notes);
    formData.append("file", file);

    return unwrapResponse(
      apiClient.post<ApiResponse<StudentDocument>>(endpoints.students.documents(studentId), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
  },
  remove: (studentId: string, documentId: string) =>
    unwrapResponse(apiClient.delete<ApiResponse<{ deleted: boolean }>>(endpoints.students.documentDetail(studentId, documentId))),
  download: async (studentId: string, documentId: string) => {
    const response = await apiClient.get<Blob>(endpoints.students.documentDownload(studentId, documentId), {
      responseType: "blob",
    });
    return response.data;
  },
};
