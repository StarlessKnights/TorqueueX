"use client";

import { useEffect } from "react";
import PartTable from "./components/PartTable";
import Header from "./components/Header";
import { useActionStore } from "./stores/actionStore";
import AddPartDialog from "./components/AddPartDialog";

export default function Home() {
  const fetchPartsAndMachines = useActionStore(
    (state) => state.fetchPartsAndMachines,
  );

  useEffect(() => {
    fetchPartsAndMachines();
  }, [fetchPartsAndMachines]);

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
