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

export async function POST(request: Request) {
  try {
    const { name } = (await request.json()) as { name: string };

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 },
      );
    }

    const trimmedName = name.trim();

    const existing = await prisma.projects.findFirst({
      where: { name: trimmedName },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Project already exists" },
        { status: 409 },
      );
    }

    const newProject = await prisma.projects.create({
      data: { name: trimmedName },
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);

    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 },
    );
  }
}
