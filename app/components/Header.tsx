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

export default function Header({
  projects,
  machines,
  onProjectSelect,
  onMachineSelect,
}: {
  projects: string[];
  machines: string[];
  onProjectSelect?: (project: string | null) => void;
  onMachineSelect?: (machine: string | null) => void;
}) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);

  return (
    <header className="border-b bg-black text-white p-4">
      <div className="grid h-12 w-full grid-cols-[1fr_auto_1fr] items-center px-4">
        <div className="flex items-center gap-4 justify-self-start">
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
                    if (onProjectSelect) onProjectSelect(null);
                  }}
                >
                  All
                </DropdownMenuItem>
                {projects.map((project) => (
                  <DropdownMenuItem
                    key={project}
                    onClick={() => {
                      setSelectedProject(project);
                      if (onProjectSelect) onProjectSelect(project);
                    }}
                  >
                    {project}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
                    if (onMachineSelect) onMachineSelect(null);
                  }}
                >
                  All
                </DropdownMenuItem>
                {machines.map((machine) => (
                  <DropdownMenuItem
                    key={machine}
                    onClick={() => {
                      setSelectedMachine(machine);
                      if (onMachineSelect) onMachineSelect(machine);
                    }}
                  >
                    {machine}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
