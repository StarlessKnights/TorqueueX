"use client";

import { useEffect, useState } from "react";
import PartTable from "./components/PartTable";
import Header from "./components/Header";
import { useMainStore } from "./stores/mainStore";
import { prisma } from "@/lib/prisma";

export default function Home() {
  const setParts = useMainStore((state) => state.setParts);

  useEffect(() => {
    async function fetchParts() {
      const parts = await prisma.parts.findMany();
      setParts(parts);
    }

    fetchParts();
  }, [setParts]);

  return (
    <div>
      <Header />
      <div className="min-h-screen mx-auto bg-zinc-950 px-4 py-4">
        <PartTable />
      </div>
    </div>
  );
}
