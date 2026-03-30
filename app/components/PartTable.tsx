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
import rustfs_client from "@/lib/rustfs";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { toast } from "sonner";

async function handleFileDownload(part: Part) {
  if (!part.cad_file) {
    throw new Error("No CAD File");
  }

  try {
    const response = await rustfs_client.send(
      new GetObjectCommand({
        Bucket: "parts",
        Key: part.cad_file,
      }),
    );

    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error("Failed to download CAD file");
    }

    if (response.Body) {
      const body = await response.Body.transformToByteArray();

      const blob = new Blob([body as BlobPart], {
        type: "application/octet-stream",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = part.cad_file.split("/").pop() || "download";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      console.error("No data in CAD file response");
    }
  } catch (error) {
    console.error("Error downloading CAD file:", error);
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
            await handleFileDownload(row.original);
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
  const filteredParts = useMainStore((state) => state.filteredParts);
  const columns = useMemo(() => getColumns(), []);
  const isLoadingParts = useMainStore((state) => state.isLoadingParts);

  // eslint-disable-next-line react-hooks/incompatible-library
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
