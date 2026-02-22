"use client";

import { useEffect, useState } from "react";
import { Part } from "./interfaces/Part";
import PartTable from "./components/PartTable";
import Header from "./components/Header";

export default function Home() {
  const [parts, setParts] = useState<Part[]>([]);
  const [machines, setMachines] = useState<string[]>([]);
  const [filteredParts, setFilteredParts] = useState<Part[] | null>(null);

  useEffect(() => {
    const newParts: Part[] = [
      {
        createDate: "02/16/2026 22:7",
        creator: "Rishabh",
        dev: {
          delete: false,
        },
        dueDate: "",
        endmill: "50% Gyroid - 3-5 wall loops",
        files: {
          cadExt: "step",
          camExt: "",
          camSize: "110 KB",
        },
        id: "08132aa0-cf52-499e-8a5f-84d2e1ee03a8",
        link: "",
        machine: "3D Printer",
        material: "PLA/CF",
        name: "7492-3001-Shooter Hood Guide Left",
        needed: "2",
        notes: "",
        partNumber: 1525,
        priority: "5",
        project: "",
        status: 7,
      },
      {
        createDate: "02/20/2026 13:47",
        creator: "Rishabh",
        dev: {
          delete: false,
        },
        dueDate: "",
        endmill: "",
        files: {
          cadExt: "step",
          camExt: "",
          camSize: "110 KB",
        },
        id: "3b0b2316-946e-4bae-a560-5d0c8a802f00",
        link: "",
        machine: "3D Printer",
        material: "PLA-CF",
        name: "7492-3002 Shooter Hood Guide Right",
        needed: "2",
        notes: "Printed...",
        partNumber: 1534,
        priority: "5",
        project: "2026 7492",
        status: 0,
      },
    ];

    setParts(newParts);

    setMachines(["Tormach", "Mill", "3D Printer", "Nebula", "Omio"]);
  }, []);

  function handleProjectSelect(project: string | null) {
    if (project === null) {
      setFilteredParts(null);
    } else {
      const filtered = parts.filter((part) => part.project === project);
      setFilteredParts(filtered);
    }
  }

  function handleMachineSelect(machine: string | null) {
    if (machine === null) {
      setFilteredParts(null);
    } else {
      const filtered = parts.filter((part) => part.machine === machine);
      setFilteredParts(filtered);
    }
  }

  function onShowCompleteSelected(showComplete: boolean) {
    if (showComplete) {
      const filtered = parts.filter((part) => part.status === 7);
      setFilteredParts(filtered);
    } else {
      setFilteredParts(null);
    }
  }

  return (
    <div>
      <Header
        projects={parts
          .map((part) => part.project)
          .filter(
            (project, index, self) =>
              project && self.indexOf(project) === index,
          )}
        machines={parts
          .map((part) => part.machine)
          .filter(
            (machine, index, self) =>
              machine && self.indexOf(machine) === index,
          )}
        onProjectSelect={handleProjectSelect}
        onMachineSelect={handleMachineSelect}
        onShowCompleteSelected={onShowCompleteSelected}
      />
      <div className="min-h-screen mx-auto bg-zinc-950 px-4 py-4">
        <PartTable parts={filteredParts || parts} machines={machines} />
      </div>
    </div>
  );
}
