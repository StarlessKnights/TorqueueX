"use client";

import { useEffect } from "react";
import PartTable from "./components/PartTable";
import Header from "./components/Header";
import { useMainStore } from "./stores/mainStore";
import AddPartDialog from "./components/AddPartDialog";

export default function Home() {
  const setParts = useMainStore((state) => state.setParts);

  useEffect(() => {
    async function fetchParts() {
      try {
        const response = await fetch("/api/parts");
        const data = await response.json();
        setParts(data);
      } catch (error) {
        console.error("Failed to fetch parts:", error);
      }
    }

    async function fetchMachines() {
      try {
        const response = await fetch("/api/machines");
        const data = (await response.json()).map(
          (machine: { name: string }) => machine.name,
        );
        useMainStore.setState({ machines: data });
      } catch (error) {
        console.error("Failed to fetch machines:", error);
      }
    }

    Promise.all([fetchParts(), fetchMachines()]);
  }, [setParts]);

  return (
    <div>
      <Header />
      <div className="min-h-screen mx-auto bg-zinc-950 px-4 py-4">
        <PartTable />
        <AddPartDialog />
      </div>
    </div>
  );
}
