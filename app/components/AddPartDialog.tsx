"use client";

import { useReducer, useState } from "react";
import { Plus } from "lucide-react";
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
import { useMainStore } from "../stores/mainStore";
import { useActionStore } from "../stores/actionStore";
import { Part } from "../interfaces/Part";
import { part_status } from "@/lib/generated/prisma/enums";

type AddFormState = {
  name: string;
  machine: string | null;
  project: string | null;
  material: string | null;
  endmill: string | null;
  creator: string;
  dueDate: Date | undefined;
  status: part_status;
  remaining: number;
  priority: number;
  notes: string;
};

type AddFormAction =
  | { type: "SET_FIELD"; field: keyof AddFormState; value: unknown }
  | { type: "RESET"; payload: AddFormState };

function addFormReducer(
  state: AddFormState,
  action: AddFormAction,
): AddFormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "RESET":
      return action.payload;
    default:
      return state;
  }
}

const initialFormState: AddFormState = {
  name: "",
  machine: null,
  project: null,
  material: null,
  endmill: null,
  creator: "",
  dueDate: undefined,
  status: part_status.NEEDS_CAD,
  remaining: 1,
  priority: 0,
  notes: "",
};

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
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

export default function AddPartDialog() {
  const addPart = useActionStore((state) => state.addPart);
  const parts = useMainStore((state) => state.parts);
  const machines = useMainStore((state) => state.machines);

  const [open, setOpen] = useState(false);
  const [formState, dispatch] = useReducer(addFormReducer, initialFormState);

  function handleAddPart() {
    if (!formState.name.trim() || !formState.creator.trim()) {
      console.warn("Name and Creator fields are required.");
      return;
    }

    const maxPartNumber = parts.reduce(
      (max, part) => Math.max(max, part.part_number),
      0,
    );

    const newPart: Part = {
      id: crypto.randomUUID(),
      name: formState.name.trim(),
      machine: formState.machine,
      project: formState.project,
      material: formState.material,
      endmill: formState.endmill,
      creator: formState.creator.trim(),
      due_date: formState.dueDate ?? null,
      status: formState.status,
      needed: formState.remaining,
      priority: formState.priority,
      notes: formState.notes,
      create_date: new Date(),
      part_number: maxPartNumber + 1,
    };

    console.log("Adding part:", newPart);

    addPart(newPart);
    dispatch({ type: "RESET", payload: initialFormState });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full"
          aria-label="Add part"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg h-[85vh] max-h-180 flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Part</DialogTitle>
          <DialogDescription>
            Fill out the fields below to create a new part.
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
                  {formState.machine || "Select machine"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    key="none"
                    onClick={() =>
                      dispatch({
                        type: "SET_FIELD",
                        field: "machine",
                        value: null,
                      })
                    }
                  >
                    None
                  </DropdownMenuItem>
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
                  {formState.dueDate?.toLocaleDateString() || "Select due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formState.dueDate}
                  onSelect={(date) =>
                    dispatch({
                      type: "SET_FIELD",
                      field: "dueDate",
                      value: date,
                    })
                  }
                  defaultMonth={formState.dueDate}
                />
              </PopoverContent>
            </Popover>
          </Field>
          <NumberStepper
            label="Remaining"
            value={formState.remaining}
            onChange={(value) =>
              dispatch({ type: "SET_FIELD", field: "remaining", value })
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
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={handleAddPart}>
            Add Part
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
