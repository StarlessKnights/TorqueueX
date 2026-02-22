export interface Part {
  id: string; // uhh not sure but i think its a db id?
  name: string; // name of the part
  status: number; // probably could be replaced with a Status enum
  material: string; // material of the part (maybe custom type?)
  machine: string; // machine the part is assigned to (maybe custom type?)
  endmill: string; // endmill (all of these should be | null)
  needed: string; // uhhhhh maybe how many of the part we need? should this be a number?
  priority: string; // Number representing priority with 1 being the highest (maybe should switch this to int??)
  notes: string; // well they're notes
  project: string; // project the part is associated with
  link: string; // link to what? its not used in the original code?
  creator: string; // who created the part
  createDate: string; // when the part was created
  partNumber: number; // part number for the part
  dueDate: string; // we should have this as a date object | null
  files: {
    // i actually just don't know what these are
    cadExt: string;
    camExt: string;
    camSize: string;
  };
  dev: {
    // what that mean?
    delete: boolean;
  };
}
