"use client";

import { useEffect, useState } from "react";
import { Part } from "./interfaces/Part";
import TableHeader from "./components/TableHeader";
import TableBody from "./components/TableBody";

export default function Home() {
  const [parts, setParts] = useState<Part[]>([]);

  useEffect(() => {
    const newParts: Part[] = [
      {
        id: "1",
        name: "Part 1",
        status: 0,
        material: "Aluminum",
        machine: "Machine A",
        endmill: "Endmill X",
        needed: "2024-07-01",
        priority: "High",
        notes: "This is a note.",
        project: "Project Alpha",
        link: "http://example.com/part1",
        creator: "Alice",
        createDate: "2024-06-01",
        partNumber: 123,
        dueDate: "2024-07-01",
        asignee: "Bob",
        files: {
          cadExt: ".step",
          camExt: ".gcode",
          camSize: "2MB",
        },
        dev: {
          delete: false,
        },
      },
      {
        id: "2",
        name: "Part 2",
        status: 1,
        material: "Steel",
        machine: "Machine B",
        endmill: "Endmill Y",
        needed: "2024-07-03",
        priority: "Medium",
        notes: "Roughing pass first.",
        project: "Project Beta",
        link: "http://example.com/part2",
        creator: "Charlie",
        createDate: "2024-06-02",
        partNumber: 124,
        dueDate: "2024-07-03",
        asignee: "Dana",
        files: {
          cadExt: ".stp",
          camExt: ".nc",
          camSize: "1.8MB",
        },
        dev: {
          delete: false,
        },
      },
      {
        id: "3",
        name: "Part 3",
        status: 0,
        material: "Brass",
        machine: "Machine C",
        endmill: "Endmill Z",
        needed: "2024-07-05",
        priority: "Low",
        notes: "Tight tolerance on bore.",
        project: "Project Gamma",
        link: "http://example.com/part3",
        creator: "Eve",
        createDate: "2024-06-03",
        partNumber: 125,
        dueDate: "2024-07-05",
        asignee: "Frank",
        files: {
          cadExt: ".step",
          camExt: ".gcode",
          camSize: "2.4MB",
        },
        dev: {
          delete: false,
        },
      },
      {
        id: "4",
        name: "Part 4",
        status: 2,
        material: "Titanium",
        machine: "Machine A",
        endmill: "Endmill Q",
        needed: "2024-07-08",
        priority: "High",
        notes: "Use reduced feed near corners.",
        project: "Project Delta",
        link: "http://example.com/part4",
        creator: "Grace",
        createDate: "2024-06-04",
        partNumber: 126,
        dueDate: "2024-07-08",
        asignee: "Hank",
        files: {
          cadExt: ".stp",
          camExt: ".tap",
          camSize: "3.1MB",
        },
        dev: {
          delete: false,
        },
      },
      {
        id: "5",
        name: "Part 5",
        status: 1,
        material: "Delrin",
        machine: "Machine D",
        endmill: "Endmill V",
        needed: "2024-07-10",
        priority: "Medium",
        notes: "Deburr edges after finish pass.",
        project: "Project Epsilon",
        link: "http://example.com/part5",
        creator: "Ivy",
        createDate: "2024-06-05",
        partNumber: 127,
        dueDate: "2024-07-10",
        asignee: "Jack",
        files: {
          cadExt: ".step",
          camExt: ".gcode",
          camSize: "1.2MB",
        },
        dev: {
          delete: false,
        },
      },
    ];

    setParts(newParts);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6">
      <div className="w-full">
        <div className="flex flex-col overflow-hidden rounded-lg shadow-lg shadow-black/30">
          <table className="w-full border-collapse bg-zinc-900">
            <TableHeader />
            <TableBody parts={parts} />
          </table>
        </div>
      </div>
    </div>
  );
}
