import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { CreateOrganizationAssetDto } from "@/types/dto";
import type { OrganizationAsset } from "@/types/domain";

export const organizationAssetsApi = {
  list: () => unwrapResponse(apiClient.get<ApiResponse<OrganizationAsset[]>>(endpoints.organizationAssets.list)),
  upload: async ({ payload, file }: { payload: CreateOrganizationAssetDto; file: File }) => {
    const formData = new FormData();
    formData.append("title", payload.title);
    formData.append("type", payload.type);
    if (payload.notes) formData.append("notes", payload.notes);
    formData.append("file", file);

    return unwrapResponse(
      apiClient.post<ApiResponse<OrganizationAsset>>(endpoints.organizationAssets.list, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
  },
  remove: (assetId: string) =>
    unwrapResponse(apiClient.delete<ApiResponse<{ deleted: boolean }>>(endpoints.organizationAssets.detail(assetId))),
  download: async (assetId: string) => {
    const response = await apiClient.get<Blob>(endpoints.organizationAssets.download(assetId), {
      responseType: "blob",
    });
    return response.data;
  },
};
