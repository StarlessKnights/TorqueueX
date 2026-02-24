import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parts } from "@/lib/generated/prisma/client";

export async function GET() {
  try {
    const parts = await prisma.parts.findMany();

    console.log("Fetched parts:", parts);

    return NextResponse.json(parts);
  } catch (error) {
    console.error("Failed to fetch parts:", error);

    return NextResponse.json(
      { error: "Failed to fetch parts" },
      { status: 500 },
    );
  }
}

// Adding a part
export async function POST(request: Request) {
  try {
    const data = (await request.json()) as parts;

    console.log("Received new part data:", data);

    const newPart = await prisma.parts.create({
      data: {
        ...data,
        create_date: new Date(),
      },
    });

    console.log("Created new part:", newPart);

    return NextResponse.json(newPart, { status: 201 });
  } catch (error) {
    console.error("Failed to create part:", error);

    return NextResponse.json(
      { error: "Failed to create part" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = (await request.json()) as parts;

    console.log("Received updated part data:", data);

    if (!data.id) {
      console.error("Part ID is required for update");
      return NextResponse.json(
        { error: "Part ID is required for update" },
        { status: 400 },
      );
    }

    const updatedPart = await prisma.parts.update({
      where: { id: data.id },
      data: data,
    });

    console.log("Updated part:", updatedPart);

    return NextResponse.json(updatedPart);
  } catch (error) {
    console.error("Failed to update part:", error);

    return NextResponse.json(
      { error: "Failed to update part" },
      { status: 500 },
    );
  }
}
