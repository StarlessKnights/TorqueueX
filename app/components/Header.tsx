"use client";

import Link from "next/link";
import { marketDeco } from "../fonts";
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
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { useMainStore } from "../stores/mainStore";
import AddProjectDialog from "./AddProjectDialog";

export default function Header() {
  const [selectedSearchCategory, setSelectedSearchCategory] = useState("parts");

  const machines = useMainStore((state) => state.machines);
  const projects = useMainStore((state) => state.projects);

  return (
    <header className="border-b bg-black text-white p-4">
      <div className="grid h-12 w-full grid-cols-[1fr_auto_1fr] items-center px-4">
        <div className="flex items-center gap-4 justify-self-start">
          <ProjectFilter
            projects={projects}
            onSelect={(project) => {
              useMainStore.setState({ projectFilter: project });
            }}
          />
          <AddProjectDialog />
          <MachineFilter
            machines={machines}
            onSelect={(machine) => {
              useMainStore.setState({ machineFilter: machine });
            }}
          />

          <ShowCompleteFilter
            onSelect={(showComplete) => {
              useMainStore.setState({ showComplete: showComplete });
            }}
          />
        </div>
        <div className="flex items-center justify-center">
          <Image
            height="48"
            width="48"
            src="/torqueLogo.png"
            alt="Torqueue Logo"
          />
          <Link
            href="/"
            className={`${marketDeco.className} text-3xl font-semibold`}
          >
            TORQUEUE V2
          </Link>
        </div>
        <div className="flex items-center gap-4 justify-self-end">
          <Tabs defaultValue="parts">
            <TabsList className="bg-[rgb(15,15,15)] border border-[rgb(48,48,48)]">
              <TabsTrigger
                value="parts"
                onClick={() => {
                  setSelectedSearchCategory("parts");
                }}
              >
                Parts
              </TabsTrigger>
              <TabsTrigger
                value="projects"
                onClick={() => {
                  setSelectedSearchCategory("projects");
                }}
              >
                Projects
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Input
            placeholder={`Search ${selectedSearchCategory === "parts" ? "parts..." : "projects..."}`}
            onChange={(event) => {
              useMainStore.setState({
                searchTerm: event.target.value,
                searchType: selectedSearchCategory,
              });
            }}
          />
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
          {groupedProjects.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {groupedProjects.map(([year, yearProjects]) => (
                <DropdownMenuSub key={year}>
                  <DropdownMenuSubTrigger>{year}</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {yearProjects.map((project) => (
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
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ))}
            </>
          )}
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

  useEffect(() => {
    onSelect(showComplete);
  }, [showComplete, onSelect]);

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
