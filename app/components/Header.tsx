"use client";

import Link from "next/link";
import { marketDeco } from "../fonts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Check, X } from "lucide-react";

export default function Header({
  projects,
  machines,
  onProjectSelect,
  onMachineSelect,
  onShowCompleteSelected,
}: {
  projects: string[];
  machines: string[];
  onProjectSelect?: (project: string | null) => void;
  onMachineSelect?: (machine: string | null) => void;
  onShowCompleteSelected?: (showComplete: boolean) => void;
}) {
  return (
    <header className="border-b bg-black text-white p-4">
      <div className="grid h-12 w-full grid-cols-[1fr_auto_1fr] items-center px-4">
        <div className="flex items-center gap-4 justify-self-start">
          <ProjectFilter
            projects={projects}
            onSelect={(project) => {
              if (onProjectSelect) onProjectSelect(project);
            }}
          />
          <MachineFilter
            machines={machines}
            onSelect={(machine) => {
              if (onMachineSelect) onMachineSelect(machine);
            }}
          />
          <ShowCompleteFilter
            onSelect={(showComplete) => {
              if (onShowCompleteSelected) onShowCompleteSelected(showComplete);
            }}
          />
        </div>
        <div className="flex items-center justify-center">
          <img
            src="/torqueLogo.png"
            alt="Torqueue Logo"
            className="h-12 w-12"
          />
          <Link
            href="/"
            className={`${marketDeco.className} text-3xl font-semibold`}
          >
            TORQUEUE
          </Link>
        </div>
        <div />
      </div>
    </header>
  );
}

function ProjectFilter({
  projects,
  onSelect,
}: {
  projects: string[];
  onSelect: (project: string | null) => void;
}) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {selectedProject || "Filter by Project"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              setSelectedProject(null);
              onSelect(null);
            }}
          >
            All
          </DropdownMenuItem>
          {projects.map((project) => (
            <DropdownMenuItem
              key={project}
              onClick={() => {
                setSelectedProject(project);
                onSelect(project);
              }}
            >
              {project}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MachineFilter({
  machines,
  onSelect,
}: {
  machines: string[];
  onSelect: (machine: string | null) => void;
}) {
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {selectedMachine || "Filter by Machine"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              setSelectedMachine(null);
              if (onSelect) onSelect(null);
            }}
          >
            All
          </DropdownMenuItem>
          {machines.map((machine) => (
            <DropdownMenuItem
              key={machine}
              onClick={() => {
                setSelectedMachine(machine);
                if (onSelect) onSelect(machine);
              }}
            >
              {machine}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ShowCompleteFilter({
  onSelect,
}: {
  onSelect: (showComplete: boolean) => void;
}) {
  const [showComplete, setShowComplete] = useState(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {!showComplete ? (
            <Check className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}{" "}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              setShowComplete(true);
              onSelect(true);
            }}
          >
            Show Completed
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setShowComplete(false);
              onSelect(false);
            }}
          >
            Hide Completed
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
