"use client";

import { useMemo, useReducer, useRef, useState } from "react";
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
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { useMainStore } from "../stores/mainStore";
import { useActionStore } from "../stores/actionStore";
import { part_status } from "@/lib/generated/prisma/enums";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox"

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
  priority: 1,
  notes: "",
};

function NumberStepper({
  label,
  value,
  lowerBound,
  upperBound,
  onChange,
}: {
  label: string;
  value: number;
  lowerBound?: number;
  upperBound?: number;
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
          onClick={() => {
            if (lowerBound === undefined || value > lowerBound) {
              onChange(value - 1);
            }
          }}
          aria-label={`Decrement ${label.toLowerCase()}`}
        >
          -
        </Button>
        <Input
          type="number"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          onClick={() => {
            if (upperBound === undefined || value < upperBound) {
              onChange(value + 1);
            }
          }}
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
  const createPartWithOptionalCAM = useActionStore(
    (state) => state.createPartWithOptionalCAM,
  );
  const machines = useMainStore((state) => state.machines);
  const projects = useMainStore((state) => state.projects);

  // Group projects by year (first 4 characters)
  const groupedProjects = useMemo(() => {
    const groups: Record<string, string[]> = {};

    for (const project of projects) {
      const year = project.slice(0, 4);
      const key = /^\d{4}$/.test(year) ? year : "Other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(project);
    }

    return Object.entries(groups).sort(([a], [b]) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      return b.localeCompare(a);
    });
  }, [projects]);

  const [open, setOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCAMFile, setSelectedCAMFile] = useState<File | null>(null);
  const [hasNoCamFile, setHasNoCamFile] = useState(false);
  const [formState, dispatch] = useReducer(addFormReducer, initialFormState);
  const inputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    dispatch({ type: "RESET", payload: initialFormState });
    setSelectedCAMFile(null);
    setHasNoCamFile(false);
  }

  function handleDialogOpenChange(nextOpen: boolean) {
    if (isSubmitting) {
      return;
    }

    setOpen(nextOpen);

    if (!nextOpen) {
      resetForm();
    }
  }

  function handleCAMFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 52428800) {
      toast.error("File Upload Limit: 50 MB");
      event.target.value = "";
      return;
    }

    setSelectedCAMFile(file);
    event.target.value = "";
  }

  async function handleAddPart() {
    if (!formState.name.trim() || !formState.creator.trim()) {
      toast.warning("Name and Creator fields are required.");
      return;
    }

    if (!selectedCAMFile && !hasNoCamFile) {
      toast.error("Please upload a CAM file or mark that this part does not have one.");
      return;
    }

    try {
      setIsSubmitting(true);

      await createPartWithOptionalCAM(
        {
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
        },
        selectedCAMFile,
      );

      resetForm();
      setOpen(false);

      toast.success("Successfully added part!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add part",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
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
          <Field>
            <FieldLabel htmlFor="project">Project</FieldLabel>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  {formState.project || "Select project"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    key="none"
                    onClick={() =>
                      dispatch({
                        type: "SET_FIELD",
                        field: "project",
                        value: null,
                      })
                    }
                  >
                    None
                  </DropdownMenuItem>
                  {groupedProjects.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      {groupedProjects.map(([year, yearProjects]) => (
                        <DropdownMenuSub key={year}>
                          <DropdownMenuSubTrigger>
                            {year}
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {yearProjects.map((project) => (
                              <DropdownMenuItem
                                key={project}
                                onClick={() =>
                                  dispatch({
                                    type: "SET_FIELD",
                                    field: "project",
                                    value: project,
                                  })
                                }
                              >
                                {project}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      ))}
                    </>
                  )}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </Field>
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
            <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
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
                  onSelect={(date) => {
                    dispatch({
                      type: "SET_FIELD",
                      field: "dueDate",
                      value: date,
                    });
                  }}
                  onDayClick={() => setDueDateOpen(false)}
                  defaultMonth={formState.dueDate}
                />
              </PopoverContent>
            </Popover>
          </Field>
          <NumberStepper
            label="Remaining"
            value={formState.remaining}
            lowerBound={1}
            onChange={(value) =>
              dispatch({ type: "SET_FIELD", field: "remaining", value })
            }
          />
          <NumberStepper
            label="Priority"
            value={formState.priority}
            lowerBound={1}
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

          <Field>
            <FieldLabel>CAM File</FieldLabel>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={isSubmitting || hasNoCamFile}
              >
                {selectedCAMFile ? "Replace CAM File" : "Select CAM File"}
              </Button>
              {selectedCAMFile ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCAMFile(null)}
                  disabled={isSubmitting}
                >
                  Remove
                </Button>
              ) : null}
            </div>
            <Label className="mt-2 block">
              CAM File: {selectedCAMFile?.name || "No file selected"}
            </Label>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={handleCAMFileSelect}
            />
            <FieldGroup className="mt-2 flex items-center gap-2">
              <Field orientation="horizontal">
                <Checkbox id="hasNoCamFile" checked={hasNoCamFile} onCheckedChange={(e) => setHasNoCamFile(!hasNoCamFile)} disabled={isSubmitting || !!selectedCAMFile} />

                <FieldLabel htmlFor="hasNoCamFile">
                  This part does not have a CAM file
                </FieldLabel>
              </Field>
            </FieldGroup>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleAddPart}
            disabled={isSubmitting}
          >
            Add Part
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
