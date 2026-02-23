import type { part_status } from "@/lib/generated/prisma/enums";

export interface Part {
  id: string;
  name: string;
  status: part_status;
  material: string | null;
  machine: string | null;
  endmill: string | null;
  needed: number;
  priority: number;
  notes: string;
  project: string | null;
  creator: string;
  create_date: Date;
  part_number: number;
  due_date: Date | null;
}
