import { Part } from "../interfaces/Part";

export function getProjectsFromParts(parts: Part[]): string[] {
  const projectsSet = new Set<string>();
  parts.forEach((part) => {
    if (part.project) {
      projectsSet.add(part.project);
    }
  });
  return Array.from(projectsSet);
}

export function getMachinesFromParts(parts: Part[]): string[] {
  const machinesSet = new Set<string>();
  parts.forEach((part) => {
    if (part.machine) {
      machinesSet.add(part.machine);
    }
  });
  return Array.from(machinesSet);
}
