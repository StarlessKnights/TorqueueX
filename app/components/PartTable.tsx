"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Part } from "../interfaces/Part";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Check, Download } from "lucide-react";
import { useMemo } from "react";
import { useMainStore } from "../stores/mainStore";
import { useActionStore } from "../stores/actionStore";
import { ManagePartDialog } from "./ManageDialog";

const getColumns = (machines: string[]): ColumnDef<Part>[] => [
  {
    accessorKey: "priority",
    header: "Priority",
  },
  {
    accessorKey: "due_date",
    header: "Due",
    size: 30,
    cell: ({ getValue }) => {
      const dueDate = getValue() as Date | null;
      if (!dueDate) return "N/A";
      return <span className={""}>{dueDate.toLocaleDateString()}</span>;
    },
  },
  {
    accessorKey: "name",
    header: "Part",
  },
  {
    accessorKey: "project",
    header: "Project",
  },
  {
    accessorKey: "machine",
    header: "Machine",
  },
  {
    accessorKey: "material",
    header: "Material",
  },
  {
    accessorKey: "endmill",
    header: "Endmill",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "needed",
    header: "Remaining",
  },
  {
    id: "complete",
    header: "Complete",
    cell: ({ row }) => {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            useActionStore.getState().completePart(row.original.id)
          }
        >
          <Check className="h-5 w-5 text-green-500" />
        </Button>
      );
    },
  },
  {
    id: "download",
    header: "Download",
    cell: ({ row }) => {
      return (
        <Button variant="outline" size="sm">
          <Download className="h-5 w-5 text-blue-500" />
        </Button>
      );
    },
  },
  {
    id: "manage",
    header: "Manage",
    cell: ({ row }) => {
      return <ManagePartDialog part={row.original} />;
    },
  },
];

export default function PartTable({}) {
  const machines = useMainStore((state) => state.machines);
  const parts = useMainStore((state) => state.parts);
  const filteredParts = useMainStore((state) => state.filteredParts);
  const columns = useMemo(() => getColumns(machines), [machines]);

  const table = useReactTable({
    data: filteredParts || parts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full overflow-hidden border border-zinc-800 rounded-lg shadow-lg shadow-black/30">
      <Table className="w-full">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    className={"font-bold text-center"}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="text-center">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
