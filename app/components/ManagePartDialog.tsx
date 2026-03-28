"use client";

import { useReducer, useRef, useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Part } from "../interfaces/Part";
import { useMainStore } from "../stores/mainStore";
import { useActionStore } from "../stores/actionStore";
import { part_status } from "@/lib/generated/prisma/enums";
import { Label } from "@/components/ui/label";

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
          onChange={(event) => onChange(Number(event.target.value))}
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

export type FormState = {
  id: string;
  name: string;
  machine: string | null;
  project: string | null;
  material: string | null;
  endmill: string | null;
  creator: string;
  due_date: Date | undefined;
  status: part_status;
  needed: number;
  priority: number;
  notes: string;
};

type FormAction =
  | { type: "SET_FIELD"; field: keyof FormState; value: unknown }
  | { type: "RESET"; payload: FormState };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "RESET":
      return action.payload;
    default:
      return state;
  }
}

function getInitialFormState(part: Part): FormState {
  return {
    id: part.id,
    name: part.name,
    machine: part.machine,
    project: part.project,
    material: part.material,
    endmill: part.endmill,
    creator: part.creator,
    due_date: part.due_date ? new Date(part.due_date) : undefined,
    status: part.status,
    needed: part.needed,
    priority: part.priority,
    notes: part.notes || "",
  };
}

function FieldLabelInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={label}>{label}</FieldLabel>
      <Input
        id={label}
        name={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

export function ManagePartDialog({ partId }: { partId: string }) {
  const part = useMainStore((state) =>
    state.parts.find((p) => p.id === partId),
  )!;
  const machines = useMainStore((state) => state.machines);
  const submitChanges = useActionStore((state) => state.submitChanges);
  const [open, setOpen] = useState(false);
  const [formState, dispatch] = useReducer(
    formReducer,
    part,
    getInitialFormState,
  );

  const inputRef = useRef<HTMLInputElement>(null);

  const uploadCADFile = useActionStore((state) => state.uploadCADFile);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadCADFile(part.id, file);

      if (!result.success) {
        console.error("Error uploading CAD file:", result.error);
      }

      event.target.files = null;
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <FieldLabelInput
            label="Name"
            value={formState.name}
            onChange={(value) =>
              dispatch({ type: "SET_FIELD", field: "name", value })
            }
          />
          <Field>
            <FieldLabel htmlFor="machine">Machine</FieldLabel>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  {formState.machine}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  {machines.map((machine) => (
                    <DropdownMenuItem
                      key={machine}
                      onClick={() =>
                        dispatch({
                          type: "SET_FIELD",
                          field: "machine",
                          value: machine,
                        })
                      }
                    >
                      {machine}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </Field>
          <FieldLabelInput
            label="Project"
            value={formState.project || ""}
            onChange={(value) =>
              dispatch({ type: "SET_FIELD", field: "project", value })
            }
          />
          <FieldLabelInput
            label="Material"
            value={formState.material || ""}
            onChange={(value) =>
              dispatch({ type: "SET_FIELD", field: "material", value })
            }
          />
          <FieldLabelInput
            label="Endmill"
            value={formState.endmill || ""}
            onChange={(value) =>
              dispatch({ type: "SET_FIELD", field: "endmill", value })
            }
          />
          <FieldLabelInput
            label="Creator"
            value={formState.creator}
            onChange={(value) =>
              dispatch({ type: "SET_FIELD", field: "creator", value })
            }
          />
          <Field>
            <FieldLabel htmlFor="due">Due</FieldLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-left"
                >
                  {formState.due_date
                    ? formState.due_date.toLocaleDateString()
                    : "Select due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    formState.due_date
                      ? new Date(formState.due_date)
                      : undefined
                  }
                  onSelect={(date) =>
                    dispatch({
                      type: "SET_FIELD",
                      field: "due_date",
                      value: date,
                    })
                  }
                  defaultMonth={
                    formState.due_date
                      ? new Date(formState.due_date)
                      : undefined
                  }
                />
              </PopoverContent>
            </Popover>
          </Field>
          <NumberStepper
            label="Needed"
            value={formState.needed}
            onChange={(value) =>
              dispatch({ type: "SET_FIELD", field: "needed", value })
            }
          />
          <Field>
            <FieldLabel htmlFor="status">Status</FieldLabel>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  {formState.status}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  {Object.values(part_status).map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() =>
                        dispatch({
                          type: "SET_FIELD",
                          field: "status",
                          value: status,
                        })
                      }
                    >
                      {status}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </Field>
          <NumberStepper
            label="Priority"
            value={formState.priority}
            onChange={(value) =>
              dispatch({ type: "SET_FIELD", field: "priority", value })
            }
          />
          <Field>
            <FieldLabel htmlFor="notes">Notes</FieldLabel>
            <textarea
              id="notes"
              name="notes"
              value={formState.notes}
              onChange={(event) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "notes",
                  value: event.target.value,
                })
              }
              rows={6}
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
            />
          </Field>

          <Button onClick={() => inputRef.current?.click()}>
            {part.cad_file ? "Update CAD File" : "Upload CAD File"}
          </Button>

          <Label className="mt-2">
            CAD File: {part.cad_file?.split("/").pop() || "No file uploaded"}
          </Label>

          <input
            type="file"
            className="hidden"
            id="cad-upload"
            onChange={handleFileChange}
            ref={inputRef}
          />
        </FieldGroup>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={() => {
              useActionStore.getState().deletePart(part.id);
              setOpen(false);
            }}
          >
            Delete
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              submitChanges(part.id, formState);
              setOpen(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
