"use client";

import { useEffect } from "react";
import PartTable from "./components/PartTable";
import Header from "./components/Header";
import { useActionStore } from "./stores/actionStore";
import AddPartDialog from "./components/AddPartDialog";
import { useMainStore } from "./stores/mainStore";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const fetchPartsAndMachines = useActionStore(
    (state) => state.fetchData,
  );

  const isLoading = useMainStore((state) => state.isLoadingParts);

  useEffect(() => {
    fetchPartsAndMachines();
  }, [fetchPartsAndMachines]);

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-background mx-auto px-4 py-4">
        <AnimatePresence>
          {!isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <PartTable />
            </motion.div>
          )}
        </AnimatePresence>
        <AddPartDialog />
      </div>
    </div>
  );
}
