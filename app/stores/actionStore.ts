import { create } from "zustand";
import { useMainStore } from "./mainStore";
import { FormState } from "../components/ManagePartDialog";
import { Part } from "../interfaces/Part";
import { parts } from "@/lib/generated/prisma/client";
import { part_status } from "@/lib/generated/prisma/enums";

type ActionStore = {
  fetchData: () => Promise<void>;
  completePart: (partId: string) => Promise<void>;
  submitChanges: (
    partId: string,
    updatedData: Partial<FormState>,
  ) => Promise<void>;
  addPart: (newPart: Part) => void;
  createAndAddPart: (formData: Partial<parts>) => Promise<parts>;
  createPartWithOptionalCAM: (
    formData: Partial<parts>,
    camFile?: File | null,
  ) => Promise<void>;
  deletePart: (partId: string, cadFilePath?: string | null) => Promise<void>;
  uploadCADFile: (
    partId: string,
    file: File,
  ) => Promise<{ success: boolean; error?: string; cadFilePath?: string }>;
};

export const useActionStore = create<ActionStore>(() => ({
  fetchData: async () => {
    try {
      useMainStore.setState({ isLoadingParts: true });

      const [partsResponse, machinesResponse, projectsResponse] =
        await Promise.all([
          fetch("/api/parts"),
          fetch("/api/machines"),
          fetch("/api/projects"),
        ]);

      if (!partsResponse.ok) {
        throw new Error("Failed to fetch parts");
      }

      if (!machinesResponse.ok) {
        throw new Error("Failed to fetch machines");
      }

      if (!projectsResponse.ok) {
        throw new Error("Failed to fetch projects");
      }

      const parts = (await partsResponse.json()) as Part[];
      const machines = (await machinesResponse.json()).map(
        (machine: { name: string }) => machine.name,
      );
      const projects = (await projectsResponse.json()).map(
        (project: { name: string }) => project.name,
      );

      useMainStore.getState().setParts(
        parts.sort((a, b) => {
          if (a.needed > 0 && b.needed <= 0) return -1;
          if (a.needed <= 0 && b.needed > 0) return 1;

          return a.priority - b.priority;
        }),
      );

      useMainStore.getState().setMachines(machines);
      useMainStore.getState().setProjects(projects);
    } catch (error) {
      console.error("Failed to fetch parts, machines, or projects:", error);
    } finally {
      useMainStore.setState({ isLoadingParts: false });
    }
  },
  completePart: async (partId: string) => {
    const part = useMainStore.getState().parts.find((p) => p.id === partId);

    if (!part) {
      throw new Error("No part found");
    }

    await fetch("/api/parts/complete", {
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
      .catch(() => {
        throw new Error("Error completing part on backend");
      });
  },
  submitChanges: async (partId: string, updatedData: Partial<FormState>) => {
    await fetch("/api/parts", {
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
        useMainStore.setState((state) => ({
          parts: state.parts.map((part) => (part.id === partId ? data : part)),
        }));
      })
      .catch(() => {
        throw new Error("Error updating part on backend");
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

      const createdPart = (await response.json()) as parts;
      useActionStore.getState().addPart(createdPart);

      return createdPart;
    } catch (error) {
      console.error("Error creating part:", error);
      throw error;
    }
  },
  createPartWithOptionalCAM: async (
    formData: Partial<parts>,
    camFile?: File | null,
  ) => {
    const createdPart = await useActionStore
      .getState()
      .createAndAddPart(formData);

    if (!camFile) {
      return;
    }

    const uploadResult = await useActionStore
      .getState()
      .uploadCADFile(createdPart.id, camFile);

    if (!uploadResult.success) {
      await useActionStore
        .getState()
        .deletePart(createdPart.id, uploadResult.cadFilePath ?? null);

      throw new Error(uploadResult.error ?? "Failed to upload CAM file");
    }
  },
  deletePart: async (partId: string, cadFilePath?: string | null) => {
    const storedPart = useMainStore
      .getState()
      .parts.find((p) => p.id === partId);
    const cadfile = cadFilePath ?? storedPart?.cad_file ?? null;

    await fetch("/api/parts", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: partId, cadfile }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to delete part");
        }
        return response.json();
      })
      .then(() => {
        useMainStore.setState((state) => ({
          parts: state.parts.filter((p) => p.id !== partId),
        }));
      })
      .catch((error) => {
        throw new Error("Error deleting part on backend:", error);
      });
  },
  uploadCADFile: async (partId: string, file: File) => {
    let cadFilePath: string | undefined;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("partId", partId);

      const uploadResponse = await fetch("/api/parts/upload-cam", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        return {
          success: false,
          error: "Failed to upload CAM file",
        };
      }

      const uploadData = await uploadResponse.json();
      cadFilePath = uploadData.cadFilePath as string;

      const apiResponse = await fetch("/api/parts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: partId,
          cad_file: cadFilePath,
        }),
      });

      if (!apiResponse.ok) {
        await fetch("/api/parts/upload-cam", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cadFilePath }),
        });

        return {
          success: false,
          error: "Failed to update part with CAM file",
          cadFilePath: cadFilePath,
        };
      }

      const updatedPart: parts = await apiResponse.json();

      // Update mainStore using proper setState
      useMainStore.setState((state) => ({
        parts: state.parts.map((p) =>
          p.id === partId ? { ...p, cad_file: updatedPart.cad_file } : p,
        ),
      }));

      return { success: true, cadFilePath: cadFilePath };
    } catch (error) {
      if (cadFilePath) {
        try {
          await fetch("/api/parts/upload-cam", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ cadFilePath }),
          });
        } catch {
          console.error(
            "Failed to clean up CAM file after error:",
            cadFilePath,
          );
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        cadFilePath: cadFilePath,
      };
    }
  },
}));
