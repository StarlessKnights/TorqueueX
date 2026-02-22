"use client";

import { useEffect, useState } from "react";
import { Part } from "./interfaces/Part";
import PartTable from "./components/PartTable";
import Header from "./components/Header";
import { useMainStore } from "./stores/mainStore";

export default function Home() {
  const parts = useMainStore((state) => state.parts);
  const setParts = useMainStore((state) => state.setParts);

  const setFilteredParts = useMainStore((state) => state.setFilteredParts);

  useEffect(() => {
    const newParts: Part[] = [
      {
        createDate: new Date("02/16/2026 22:7"),
        creator: "Rishabh",
        dueDate: null,
        endmill: "50% Gyroid - 3-5 wall loops",
        files: {
          cadExt: "step",
          camExt: "",
          camSize: "110 KB",
        },
        id: "08132aa0-cf52-499e-8a5f-84d2e1ee03a8",
        machine: "3D Printer",
        material: "PLA/CF",
        name: "7492-3001-Shooter Hood Guide Left",
        needed: 2,
        notes: "",
        partNumber: 1525,
        priority: 5,
        project: null,
        status: 7,
      },
      {
        createDate: new Date("02/20/2026 13:47"),
        creator: "Rishabh",
        dueDate: null,
        endmill: "",
        files: {
          cadExt: "step",
          camExt: "",
          camSize: "110 KB",
        },
        id: "3b0b2316-946e-4bae-a560-5d0c8a802f00",
        machine: "3D Printer",
        material: "PLA-CF",
        name: "7492-3002 Shooter Hood Guide Right",
        needed: 2,
        notes: "Printed...",
        partNumber: 1534,
        priority: 5,
        project: "2026 7492",
        status: 0,
      },
    ];

    setParts(newParts);

    useMainStore.setState({
      machines: ["3D Printer", "Omio", "Tormach"],
    });
  }, []);

  return (
    <div>
      <Header />
      <div className="min-h-screen mx-auto bg-zinc-950 px-4 py-4">
        <PartTable />
      </div>
    </div>
  );
}
