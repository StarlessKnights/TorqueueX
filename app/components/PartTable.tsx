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
import { Check, Download, FileXCorner } from "lucide-react";
import { useMemo } from "react";
import { useMainStore } from "../stores/mainStore";
import { useActionStore } from "../stores/actionStore";
import { ManagePartDialog } from "./ManagePartDialog";
import { toast } from "sonner";

async function handleFileDownload(part: Part) {
  if (!part.cad_file) {
    throw new Error("No CAD File");
  }

  try {
    const response = await fetch(`/api/parts/download-cam?file=${encodeURIComponent(part.cad_file)}`);

    if (!response.ok) {
      throw new Error("Failed to download CAD file");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = part.cad_file.split("/").pop() || "download";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw error;
  }
}

const getColumns = (): ColumnDef<Part>[] => [
  {
    accessorKey: "priority",
    header: "Priority",
  },
  {
    accessorKey: "due_date",
    header: "Due",
    size: 30,
    cell: ({ getValue }) => {
      const dueDate = getValue();

      if (!dueDate) return "N/A";
      if (typeof dueDate === "string")
        return <span className={""}>{dueDate.split("T")[0]}</span>;
      if (typeof dueDate === "object")
        return (
          <span className={""}>
            {(dueDate as Date).toISOString().split("T")[0]}
          </span>
        );
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
          onClick={async () => {
            try {
              await useActionStore.getState().completePart(row.original.id)

              toast.success("Successfully completed part!");
            } catch (e: unknown) {
              if (e instanceof Error) {
                toast.error(e.message)
              }
            }
          }
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
      return row.original.cad_file ? (
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            try {
              await handleFileDownload(row.original);

              toast.success("Successfully downloaded CAM!")
            } catch {
              toast.error("Unable to download CAM")
            }
          }}
        >
          <Download className="h-5 w-5 text-blue-500" />
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={() => { toast.error("No file to download") }}>
          <div className="relative inline-flex items-center justify-center">
            <FileXCorner className="h-5 w-5 text-red-500" />
          </div>
        </Button >
      );
    },
  },
  {
    id: "manage",
    header: "Manage",
    cell: ({ row }) => {
      return <ManagePartDialog partId={row.original.id} />;
    },
  },
];

export default function PartTable({ }) {
  const parts = useMainStore((state) => state.parts);

  const showComplete = useMainStore((state) => state.showComplete);
  const searchTerm = useMainStore((state) => state.searchTerm);
  const searchType = useMainStore((state) => state.searchType);
  const projectFilter = useMainStore((state) => state.projectFilter);
  const machineFilter = useMainStore((state) => state.machineFilter);

  const filteredParts = useMemo(() => {
    let tempParts: Part[] = parts;

    tempParts = showComplete ? tempParts : tempParts.filter((part) => { return part.needed > 0; });
    tempParts = projectFilter == null ? tempParts : tempParts.filter((part) => { return part.project === projectFilter; });
    tempParts = machineFilter == null ? tempParts : tempParts.filter((part) => { return part.machine === machineFilter; });

    if (searchTerm != "") {
      switch (searchType) {
        case "projects":
          tempParts = tempParts.filter((part) => { return part.project?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false; });
          break;
        case "parts":
          tempParts = tempParts.filter((part) => { return part.name.toLowerCase().includes(searchTerm.toLowerCase()) });
          break;
      }
    }

    return tempParts;
  }, [parts, showComplete, searchTerm, searchType, machineFilter, projectFilter]);

  const columns = useMemo(() => getColumns(), []);
  const isLoadingParts = useMainStore((state) => state.isLoadingParts);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredParts || parts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full overflow-hidden border border-zinc-50 dark:border-zinc-800 rounded-lg shadow-lg shadow-black/30">
      <Table className="w-full bg-linear-to-br from-[oklch(0.951_0.005_285.823)] to-[oklch(0.871_0.005_285.823)] dark:from-[oklch(0.151_0.005_285.823)] dark:to-[oklch(0.171_0.005_285.823)]">
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
          {isLoadingParts ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Loading parts...
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={row.original.needed === 0 ? "opacity-50" : ""}
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
