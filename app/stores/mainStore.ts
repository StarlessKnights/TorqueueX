import { create } from "zustand";
import { Part } from "../interfaces/Part";

type MainStore = {
  isLoadingParts: boolean;

  parts: Part[];
  machines: string[];
  projects: string[];

  searchTerm: string;
  searchType: string;
  showComplete: boolean;

  projectFilter: string | null;
  machineFilter: string | null;

  setIsLoadingParts: (isLoading: boolean) => void;
  setParts: (parts: Part[]) => void;
  setMachines: (machines: string[]) => void;
  setProjects: (projects: string[]) => void;
};

export const useMainStore = create<MainStore>((set) => ({
  isLoadingParts: false,

  parts: [],
  machines: [],
  projects: [],

  searchTerm: "",
  searchType: "",
  showComplete: false,

  projectFilter: null,
  machineFilter: null,

  setIsLoadingParts: (isLoading) => set({ isLoadingParts: isLoading }),
  setParts: (parts: Part[]) => set({ parts }),
  setMachines: (machines: string[]) => set({ machines }),
  setProjects: (projects: string[]) => set({ projects }),
}));
