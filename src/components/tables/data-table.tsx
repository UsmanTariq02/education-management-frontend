"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DataTableProps<TData> {
  data: TData[];
  columns: Array<ColumnDef<TData>>;
  pageCount?: number;
  pagination?: PaginationState;
  sorting?: SortingState;
  rowSelection?: RowSelectionState;
  onPaginationChange?: (state: PaginationState) => void;
  onSortingChange?: (state: SortingState) => void;
  onRowSelectionChange?: (state: RowSelectionState) => void;
  enableRowSelection?: boolean;
  getRowId?: (row: TData, index: number) => string;
  rowClassName?: string;
}

export function DataTable<TData>({
  data,
  columns,
  pageCount,
  pagination,
  sorting,
  rowSelection,
  onPaginationChange,
  onSortingChange,
  onRowSelectionChange,
  enableRowSelection = false,
  getRowId,
  rowClassName,
}: DataTableProps<TData>) {
  const selectionColumn: ColumnDef<TData> = {
    id: "__select__",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
        onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)}
        aria-label="Select all rows"
      />
    ),
    cell: ({ row }) => (
      <Checkbox checked={row.getIsSelected()} onChange={(event) => row.toggleSelected(event.target.checked)} aria-label="Select row" />
    ),
  };

  const tableColumns = enableRowSelection ? [selectionColumn, ...columns] : columns;
  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      pagination,
      sorting,
      rowSelection,
    },
    manualPagination: true,
    manualSorting: true,
    enableRowSelection,
    getRowId: getRowId ? (originalRow, index) => getRowId(originalRow, index) : (originalRow, index) => {
      const row = originalRow as { id?: string };
      return row.id ?? String(index);
    },
    pageCount,
    getCoreRowModel: getCoreRowModel(),
    onPaginationChange: (updater) => {
      if (!pagination || !onPaginationChange) return;
      const nextState = typeof updater === "function" ? updater(pagination) : updater;
      onPaginationChange(nextState);
    },
    onSortingChange: (updater) => {
      if (!sorting || !onSortingChange) return;
      const nextState = typeof updater === "function" ? updater(sorting) : updater;
      onSortingChange(nextState);
    },
    onRowSelectionChange: onRowSelectionChange
      ? (updater) => {
          const nextState = typeof updater === "function" ? updater(rowSelection ?? {}) : updater;
          onRowSelectionChange(nextState);
        }
      : undefined,
  });

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/95 shadow-sm shadow-slate-900/5">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className={rowClassName}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getAllLeafColumns().length} className="h-24 text-center text-muted-foreground">
                  No records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pagination ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Page {pagination.pageIndex + 1}
            {pageCount ? ` of ${pageCount}` : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
