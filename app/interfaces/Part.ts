export interface Part {
  id: string;
  name: string;
  status: Status;
  material: string | null;
  machine: string | null;
  endmill: string | null;
  needed: number;
  priority: number;
  notes: string;
  project: string | null;
  creator: string;
  createDate: Date;
  partNumber: number;
  dueDate: Date | null;
  files: {
    cadExt: string;
    camExt: string;
    camSize: string;
  };
}

enum Status {
  NEEDS_CAD = 0,
  NEEDS_CAM = 1,
  NEEDS_3D_PRINTING = 2,
  NEEDS_ORDERING = 3,
  NEEDS_MACHINING = 4,
  NEEDS_PROCESSING = 5,
  NEEDS_ASSEMBLY = 6,
  COMPLETE = 7,
}
