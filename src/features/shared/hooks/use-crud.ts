"use client";

import { useMutation, useQuery, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import { normalizeApiError } from "@/lib/api/errors";
import type { PaginationParams } from "@/types/api";

interface CrudOptions<TList, TCreate, TUpdate> {
  queryKey: readonly unknown[];
  listFn: (params: PaginationParams) => Promise<TList>;
  createFn?: (payload: TCreate) => Promise<unknown>;
  updateFn?: (id: string, payload: TUpdate) => Promise<unknown>;
  deleteFn?: (id: string) => Promise<unknown>;
  params: PaginationParams;
}

export function useCrudList<TList>({ queryKey, listFn, params }: Pick<CrudOptions<TList, never, never>, "queryKey" | "listFn" | "params">) {
  return useQuery({
    queryKey: [...queryKey, params],
    queryFn: () => listFn(params),
  });
}

export function useCrudMutations<TCreate, TUpdate>({
  queryKey,
  createFn,
  updateFn,
  deleteFn,
}: Pick<CrudOptions<never, TCreate, TUpdate>, "queryKey" | "createFn" | "updateFn" | "deleteFn">) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (payload: TCreate) => {
      if (!createFn) throw new Error("createFn is not configured");
      return createFn(payload);
    },
    onSuccess: () => {
      toast.success("Record saved successfully");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  } satisfies UseMutationOptions<unknown, unknown, TCreate>);

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: TUpdate }) => {
      if (!updateFn) throw new Error("updateFn is not configured");
      return updateFn(id, payload);
    },
    onSuccess: () => {
      toast.success("Record updated successfully");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!deleteFn) throw new Error("deleteFn is not configured");
      return deleteFn(id);
    },
    onSuccess: () => {
      toast.success("Record deleted successfully");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
