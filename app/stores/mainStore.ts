import { create } from "zustand";
import { Part } from "../interfaces/Part";

type MainStore = {
  parts: Part[];
  machines: string[];
  filteredParts: Part[] | null;

  setParts: (parts: Part[]) => void;
  setFilteredParts: (filteredParts: Part[] | null) => void;
  setMachines: (machines: string[]) => void;
};

export const useMainStore = create<MainStore>((set) => ({
  parts: [],
  filteredParts: null,
  machines: [],

  setParts: (parts: Part[]) => set({ parts }),
  setFilteredParts: (filteredParts: Part[] | null) => set({ filteredParts }),
  setMachines: (machines: string[]) => set({ machines }),
}));
