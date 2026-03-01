import { create } from "zustand";
import { useMainStore } from "./mainStore";
import { FormState } from "../components/ManageDialog";
import { Part } from "../interfaces/Part";
import { parts } from "@/lib/generated/prisma/client";
import rustfs_client from "@/lib/rustfs";
import { PutObjectCommand } from "@aws-sdk/client-s3";

type ActionStore = {
  completePart: (partId: string) => void;
  submitChanges: (partId: string, updatedData: Partial<FormState>) => void;
  addPart: (newPart: Part) => void;
  uploadCADFile: (partId: string, file: File) => Promise<{ success: boolean; error?: string }>;
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
}));
