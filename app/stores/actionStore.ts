import { create } from "zustand";
import { useMainStore } from "./mainStore";
import { FormState } from "../components/ManageDialog";
import { part_status } from "@/lib/generated/prisma/enums";

type ActionStore = {
  completePart: (partId: string) => void;
  submitChanges: (partId: string, updatedData: Partial<FormState>) => void;
};

export const useActionStore = create<ActionStore>((set) => ({
  completePart: (partId: string) => {
    useMainStore.setState((state) => {
      const updatedParts = state.parts.map((part) => {
        if (part.id === partId) {
          return { ...part, status: part_status.COMPLETE };
        }
        return part;
      });
      return { parts: updatedParts };
    });
  },
  submitChanges: (partId: string, updatedData: Partial<FormState>) => {
    useMainStore.setState((state) => {
      console.log(
        "Submitting changes for partId:",
        partId,
        "with data:",
        updatedData,
      );

      console.log("Replace this with an actual backend call later");

      const updatedParts = state.parts.map((part) => {
        if (part.id === partId) {
          return { ...part, ...updatedData };
        }
        return part;
      });
      return { parts: updatedParts };
    });
  },
}));
