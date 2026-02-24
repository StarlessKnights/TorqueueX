import { create } from "zustand";
import { Part } from "../interfaces/Part";

type MainStore = {
  isLoadingParts: boolean;

  parts: Part[];
  machines: string[];
  filteredParts: Part[] | null;

  setIsLoadingParts: (isLoading: boolean) => void;
  setParts: (parts: Part[]) => void;
  setFilteredParts: (filteredParts: Part[] | null) => void;
  setMachines: (machines: string[]) => void;
};

export const useMainStore = create<MainStore>((set) => ({
  isLoadingParts: false,

  parts: [],
  filteredParts: null,
  machines: [],

  setIsLoadingParts: (isLoading) => set({ isLoadingParts: isLoading }),
  setParts: (parts: Part[]) => set({ parts }),
  setFilteredParts: (filteredParts: Part[] | null) => set({ filteredParts }),
  setMachines: (machines: string[]) => set({ machines }),
}));
