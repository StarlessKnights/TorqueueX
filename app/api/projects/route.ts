import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const projects = await prisma.projects.findMany();

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);

    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 },
    );
  }
}
