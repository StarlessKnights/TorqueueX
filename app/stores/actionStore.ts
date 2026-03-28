import { create } from "zustand";
import { useMainStore } from "./mainStore";
import { FormState } from "../components/ManagePartDialog";
import { Part } from "../interfaces/Part";
import { parts } from "@/lib/generated/prisma/client";
import rustfs_client from "@/lib/rustfs";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { part_status } from "@/lib/generated/prisma/enums";

type ActionStore = {
  fetchPartsAndMachines: () => Promise<void>;
  completePart: (partId: string) => void;
  submitChanges: (partId: string, updatedData: Partial<FormState>) => void;
  addPart: (newPart: Part) => void;
  createAndAddPart: (formData: Partial<parts>) => Promise<void>;
  deletePart: (partId: string) => void;
  uploadCADFile: (
    partId: string,
    file: File,
  ) => Promise<{ success: boolean; error?: string }>;
  filterPartsByProject: (project: string | null) => void;
  filterPartsByMachine: (machine: string | null) => void;
  filterPartsByStatus: (showComplete: boolean) => void;
};

export const useActionStore = create<ActionStore>(() => ({
  fetchPartsAndMachines: async () => {
    try {
      useMainStore.setState({ isLoadingParts: true });

      const [partsResponse, machinesResponse] = await Promise.all([
        fetch("/api/parts"),
        fetch("/api/machines"),
      ]);

      if (!partsResponse.ok) {
        throw new Error("Failed to fetch parts");
      }

      if (!machinesResponse.ok) {
        throw new Error("Failed to fetch machines");
      }

      const parts = (await partsResponse.json()) as Part[];
      const machines = (await machinesResponse.json()).map(
        (machine: { name: string }) => machine.name,
      );

      useMainStore.getState().setParts(parts);
      useMainStore.getState().setMachines(machines);
    } catch (error) {
      console.error("Failed to fetch parts and machines:", error);
    } finally {
      useMainStore.setState({ isLoadingParts: false });
    }
  },
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
  createAndAddPart: async (formData: Partial<parts>) => {
    try {
      const maxPartNumber = useMainStore
        .getState()
        .parts.reduce((max, part) => {
          return part.part_number > max ? part.part_number : max;
        }, 0);

      const newPart: parts = {
        id: crypto.randomUUID(),
        name: formData.name || "",
        machine: formData.machine || null,
        project: formData.project || null,
        material: formData.material || null,
        endmill: formData.endmill || null,
        creator: formData.creator || "",
        due_date: formData.due_date || null,
        status: formData.status || part_status.NEEDS_CAD,
        needed: formData.needed || 1,
        priority: formData.priority || 0,
        notes: formData.notes || "",
        create_date: new Date(),
        part_number: maxPartNumber + 1,
        cad_file: null,
      };

      const response = await fetch("/api/parts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPart),
      });

      if (!response.ok) {
        throw new Error("Failed to create part");
      }

      useActionStore.getState().addPart(newPart);
    } catch (error) {
      console.error("Error creating part:", error);
      throw error;
    }
  },
  deletePart: (partId: string) => {
    fetch("/api/parts", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: partId }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to delete part");
        }
        return response.json();
      })
      .then(() => {
        console.log("Successfully deleted part on backend");

        useMainStore.setState((state) => ({
          parts: state.parts.filter((p) => p.id !== partId),
        }));
      })
      .catch((error) => {
        console.error("Error deleting part on backend:", error);
      });
  },
  uploadCADFile: async (partId: string, file: File) => {
    try {
      // S3 Upload
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const s3Response = await rustfs_client.send(
        new PutObjectCommand({
          Bucket: "parts",
          Key: `${partId}/${file.name}`,
          Body: uint8Array,
          ContentType: file.type,
        }),
      );

      if (s3Response.$metadata.httpStatusCode !== 200) {
        return {
          success: false,
          error: "Failed to upload file to S3",
        };
      }

      // API Update
      const apiResponse = await fetch("/api/parts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: partId,
          cad_file: `${partId}/${file.name}`,
        }),
      });

      if (!apiResponse.ok) {
        return {
          success: false,
          error: "Failed to update part with CAD file",
        };
      }

      const updatedPart: parts = await apiResponse.json();
      console.log("Successfully updated part with CAD file:", updatedPart);

      // Update mainStore using proper setState
      useMainStore.setState((state) => ({
        parts: state.parts.map((p) =>
          p.id === partId ? { ...p, cad_file: updatedPart.cad_file } : p,
        ),
      }));

      return { success: true };
    } catch (error) {
      console.error("Error uploading CAD file:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
  filterPartsByProject: (project: string | null) => {
    const allParts = useMainStore.getState().parts;
    if (project === null) {
      useMainStore.setState({ filteredParts: null });
    } else {
      const filtered = allParts.filter((part) => part.project === project);
      useMainStore.setState({ filteredParts: filtered });
    }
  },
  filterPartsByMachine: (machine: string | null) => {
    const allParts = useMainStore.getState().parts;
    if (machine === null) {
      useMainStore.setState({ filteredParts: null });
    } else {
      const filtered = allParts.filter((part) => part.machine === machine);
      useMainStore.setState({ filteredParts: filtered });
    }
  },
  filterPartsByStatus: (showComplete: boolean) => {
    const allParts = useMainStore.getState().parts;
    if (showComplete) {
      useMainStore.setState({ filteredParts: null });
    } else {
      const filtered = allParts.filter(
        (part) => part.status !== part_status.COMPLETE,
      );
      useMainStore.setState({ filteredParts: filtered });
    }
  },
}));
