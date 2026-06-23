"use client";

import { useMemo, useState, useEffect, useRef } from "react";
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
import { useMainStore } from "../stores/mainStore";
import { toast } from "sonner";

const TEAMS = ["None", "1477", "7492"] as const;

export default function AddProjectDialog() {
  const projects = useMainStore((state) => state.projects);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [team, setTeam] = useState<string>("None");
  const [name, setName] = useState("");
  const [countdown, setCountdown] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const yearStr = useMemo(() => year.trim() || "____", [year]);
  const namePart = useMemo(() => name.trim(), [name]);

  const formattedName = useMemo(() => {
    if (!namePart) {
      if (team === "None") return `${yearStr}  ...`;
      return `${yearStr} ${team}  ...`;
    }
    if (team === "None") return `${yearStr} ${namePart}`;
    return `${yearStr} ${team} ${namePart}`;
  }, [yearStr, team, namePart]);

  const isValidFormat = useMemo(() => {
    const yearValid = /^\d{4}$/.test(year.trim());
    const nameValid = name.trim().length > 0;
    return yearValid && nameValid;
  }, [year, name]);

  function resetForm() {
    setStep("form");
    setYear(new Date().getFullYear().toString());
    setTeam("None");
    setName("");
    setCountdown(5);
    setIsSubmitting(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function handleDialogOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  }

  useEffect(() => {
    if (step !== "confirm") return;

    setCountdown(5);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [step]);

  function handleNext() {
    if (!isValidFormat) {
      toast.warning("Year must be 4 digits and project name is required.");
      return;
    }
    setStep("confirm");
  }

  async function handleCreate() {
    try {
      setIsSubmitting(true);

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formattedName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create project");
      }

      const createdProject = await response.json();

      useMainStore.setState((state) => ({
        projects: [...state.projects, createdProject.name],
      }));

      toast.success(`Project "${formattedName}" created!`);
      resetForm();
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create project",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit = step === "confirm" && countdown <= 0 && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Add project">
          <Plus className="mr-1 h-4 w-4" />
          Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Project</DialogTitle>
          <DialogDescription>
            Create a new project in the format:{" "}
            <span className="font-mono">(Year) (Team) (Project Name)</span>
          </DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="year">Year</FieldLabel>
              <Input
                id="year"
                value={year}
                onChange={(e) =>
                  setYear(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="2026"
                maxLength={4}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="team">Team</FieldLabel>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    {team}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    {TEAMS.map((t) => (
                      <DropdownMenuItem key={t} onClick={() => setTeam(t)}>
                        {t}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </Field>

            <Field>
              <FieldLabel htmlFor="name">Project Name</FieldLabel>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Robot, Shop, etc."
              />
            </Field>

            {!isValidFormat && name.trim().length > 0 && (
              <p className="text-sm text-destructive">
                Year must be exactly 4 digits.
              </p>
            )}

            <div className="rounded-md border bg-card p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Preview
              </p>
              <div className="flex items-stretch font-mono text-sm">
                <div className="flex items-center rounded-l-md border bg-primary/5 px-3 py-1.5 font-semibold">
                  {yearStr}
                </div>
                {team !== "None" && (
                  <div className="flex items-center border-b border-t border-r bg-secondary/30 px-3 py-1.5 text-muted-foreground">
                    {team}
                  </div>
                )}
                <div
                  className={`flex flex-1 items-center border px-3 py-1.5 ${team === "None" ? "rounded-r-md" : "rounded-r-md border-l-0"}`}
                >
                  {namePart || (
                    <span className="italic text-muted-foreground">name</span>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleNext} disabled={!isValidFormat}>
                Next
              </Button>
            </DialogFooter>
          </FieldGroup>
        ) : (
          <FieldGroup>
            <div className="rounded-md border bg-card p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                New Project
              </p>
              <div className="flex items-stretch font-mono text-sm">
                <div className="flex items-center rounded-l-md border bg-primary/5 px-3 py-1.5 font-semibold">
                  {yearStr}
                </div>
                {team !== "None" && (
                  <div className="flex items-center border-b border-t border-r bg-secondary/30 px-3 py-1.5 text-muted-foreground">
                    {team}
                  </div>
                )}
                <div
                  className={`flex flex-1 items-center border px-3 py-1.5 ${team === "None" ? "rounded-r-md" : "rounded-r-md border-l-0"}`}
                >
                  {namePart}
                </div>
              </div>
            </div>

            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Does your part belong to an existing project?
              </p>
              {projects.length > 0 ? (
                <div className="mt-2">
                  <p className="mb-1 text-xs text-amber-600 dark:text-amber-400">
                    Existing projects:
                  </p>
                  <ul className="list-inside list-disc space-y-0.5 text-xs text-amber-700 dark:text-amber-300">
                    {projects.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  No existing projects yet.
                </p>
              )}
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                Make sure your part doesn&apos;t fit into one of these before
                creating a new project.
              </p>
            </div>

            {countdown > 0 && (
              <div className="rounded-md border bg-muted p-3 text-center">
                <p className="text-sm text-muted-foreground">
                  Please wait {countdown}s to confirm...
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setStep("form")}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button onClick={handleCreate} disabled={!canSubmit}>
                {isSubmitting
                  ? "Creating..."
                  : countdown > 0
                    ? `Wait ${countdown}s`
                    : "Create Project"}
              </Button>
            </DialogFooter>
          </FieldGroup>
        )}
      </DialogContent>
    </Dialog>
  );
}
