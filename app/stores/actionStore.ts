import { create } from "zustand";
import { useMainStore } from "./mainStore";
import { FormState } from "../components/ManageDialog";
import { part_status } from "@/lib/generated/prisma/enums";
import { Part } from "../interfaces/Part";
import { parts } from "@/lib/generated/prisma/client";

type ActionStore = {
  completePart: (partId: string) => void;
  submitChanges: (partId: string, updatedData: Partial<FormState>) => void;
  addPart: (newPart: Part) => void;
};

export const useActionStore = create<ActionStore>(() => ({
  completePart: (partId: string) => {
    const part = useMainStore.getState().parts.find((p) => p.id === partId);

    if (!part) {
      console.error("Part not found for completion:", partId);
      return;
    }

    fetch("/api/parts/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ partId }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to complete part");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Successfully completed part on backend:", data);

        useMainStore.setState((state) => {
          const updatedParts = state.parts.map((p) => {
            if (p.id === partId) {
              return {
                ...p,
                needed: data.newNeeded,
                status: data.newStatus,
              };
            }
            return p;
          });
          return { parts: updatedParts };
        });
      })
      .catch((error) => {
        console.error("Error completing part on backend:", error);
      });
  },
  submitChanges: (partId: string, updatedData: Partial<FormState>) => {
    console.log(
      "Submitting changes for partId:",
      partId,
      "with data:",
      updatedData,
    );

    fetch("/api/parts", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: partId, ...(updatedData as Partial<parts>) }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to update part");
        }
        return response.json();
      })
      .then((data: parts) => {
        console.log("Successfully updated part on backend:", data);

        useMainStore.setState((state) => ({
          parts: state.parts.map((part) => (part.id === partId ? data : part)),
        }));
      })
      .catch((error) => {
        console.error("Error updating part on backend:", error);
      });
  },
  addPart: (newPart: Part) => {
    useMainStore.setState((state) => ({
      parts: [newPart, ...state.parts],
    }));
  },
}));
