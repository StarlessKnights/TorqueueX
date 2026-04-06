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
import { toast } from "sonner";

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
  );

  if (part === null || part === undefined) {
    return <div>Not found</div>;
  }

  return PartForm(part);
}

function PartForm(part: Part) {
  const machines = useMainStore((state) => state.machines);
  const projects = useMainStore((state) => state.projects);
  const submitChanges = useActionStore((state) => state.submitChanges);
  const [open, setOpen] = useState(false);
  const [formState, dispatch] = useReducer(
    formReducer,
    part,
    getInitialFormState,
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCAMFile, setSelectedCAMFile] = useState<File | null>(null);
  const uploadCADFile = useActionStore((state) => state.uploadCADFile);

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

  function handleDialogOpenChange(nextOpen: boolean) {
    if (isSubmitting) {
      return;
    }

    setOpen(nextOpen);

    if (!nextOpen) {
      setSelectedCAMFile(null);
    }
  }

  async function handleSave() {
    try {
      setIsSubmitting(true);

      await submitChanges(part.id, formState);

      if (selectedCAMFile) {
        const uploadResult = await uploadCADFile(part.id, selectedCAMFile);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error ?? "Failed to upload CAM file");
        }
      }

      toast.success("Successfully saved changes!");
      setSelectedCAMFile(null);
      setOpen(false);
    } catch (e: unknown) {
      if (e instanceof Error) {
        toast.error(e.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
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
          <Field>
            <FieldLabel htmlFor="project">Project</FieldLabel>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  {formState.project}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  {projects.map((project) => (
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

          <Field>
            <FieldLabel>CAM File</FieldLabel>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={isSubmitting}
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
          </Field>

          <Label className="mt-2 block">
            CAM File:{" "}
            {selectedCAMFile?.name ||
              part.cad_file?.split("/").pop() ||
              "No file uploaded"}
          </Label>

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleCAMFileSelect}
          />
        </FieldGroup>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={isSubmitting}
            onClick={async () => {
              setOpen(false);

              try {
                await useActionStore.getState().deletePart(part.id);

                toast.success("Successfully deleted part!");
              } catch (e: unknown) {
                if (e instanceof Error) {
                  toast.error(e.message);
                }
              }
            }}
          >
            Delete
          </Button>
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={handleSave}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
