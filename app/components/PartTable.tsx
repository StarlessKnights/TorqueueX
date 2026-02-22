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
import { Check, Download, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

function toNumber(value: string | number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function NumberStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          onClick={() => onChange(value - 1)}
          aria-label={`Decrement ${label.toLowerCase()}`}
        >
          -
        </Button>
        <Input
          type="number"
          value={value}
          onChange={(event) => onChange(toNumber(event.target.value))}
          className="text-center"
        />
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          onClick={() => onChange(value + 1)}
          aria-label={`Increment ${label.toLowerCase()}`}
        >
          +
        </Button>
      </div>
    </Field>
  );
}

function ManagePartDialog({
  part,
  machines,
}: {
  part: Part;
  machines: string[];
}) {
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [selectedDueDate, setSelectedDueDate] = useState<Date>();
  const [status, setStatus] = useState<number>(toNumber(part.status));
  const [remaining, setRemaining] = useState<number>(toNumber(part.needed));
  const [priority, setPriority] = useState<number>(toNumber(part.priority));
  const [notes, setNotes] = useState<string>(part.notes || "");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-5 w-5 text-zinc-500" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg h-[85vh] max-h-180 flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit {part.name}</DialogTitle>
          <DialogDescription>
            Here you can edit the details of this part.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup className="overflow-y-auto pr-1">
          <FieldLabelInput label="Name" defaultValue={part.name} />
          <Field>
            <FieldLabel htmlFor="machine">Machine</FieldLabel>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  {selectedMachine || part.machine}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  {machines.map((machine) => (
                    <DropdownMenuItem
                      key={machine}
                      onClick={() => setSelectedMachine(machine)}
                    >
                      {machine}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </Field>
          <FieldLabelInput label="Project" defaultValue={part.project} />
          <FieldLabelInput label="Material" defaultValue={part.material} />
          <FieldLabelInput label="Endmill" defaultValue={part.endmill} />
          <FieldLabelInput label="Creator" defaultValue={part.creator} />
          <Field>
            <FieldLabel htmlFor="due">Due</FieldLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-left"
                >
                  {selectedDueDate
                    ? selectedDueDate.toLocaleDateString()
                    : part.dueDate}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDueDate}
                  onSelect={setSelectedDueDate}
                  defaultMonth={selectedDueDate}
                />
              </PopoverContent>
            </Popover>
          </Field>
          <NumberStepper label="Status" value={status} onChange={setStatus} />
          <NumberStepper
            label="Remaining"
            value={remaining}
            onChange={setRemaining}
          />
          <NumberStepper
            label="Priority"
            value={priority}
            onChange={setPriority}
          />
          <Field>
            <FieldLabel htmlFor="notes">Notes</FieldLabel>
            <textarea
              id="notes"
              name="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={6}
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="destructive">Delete</Button>
          <Button variant="outline">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const getColumns = (machines: string[]): ColumnDef<Part>[] => [
  {
    accessorKey: "priority",
    header: "Priority",
  },
  {
    accessorKey: "dueDate",
    header: "Due",
    size: 30,
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
        <Button variant="outline" size="sm">
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
      return <ManagePartDialog part={row.original} machines={machines} />;
    },
  },
];

function FieldLabelInput({
  label,
  defaultValue,
}: {
  label: string;
  defaultValue: string;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={label}>{label}</FieldLabel>
      <Input id={label} name={label} defaultValue={defaultValue} />
    </Field>
  );
}

export default function PartTable({
  parts,
  machines,
}: {
  parts: Part[];
  machines: string[];
}) {
  const columns = useMemo(() => getColumns(machines), [machines]);

  const table = useReactTable({
    data: parts,
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
