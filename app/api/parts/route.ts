import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parts } from "@/lib/generated/prisma/client";
import rustfs_client from "@/lib/rustfs";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function GET() {
  try {
    const parts = await prisma.parts.findMany({
      orderBy: [{ priority: "asc" }, { create_date: "asc" }],
    });

    return NextResponse.json(parts);
  } catch (error) {
    console.error("Failed to fetch parts:", error);

    return NextResponse.json(
      { error: "Failed to fetch parts:" + error },
      { status: 500 },
    );
  }
}

// Adding a part
export async function POST(request: Request) {
  try {
    const data = (await request.json()) as parts;

    const newPart = await prisma.parts.create({
      data: {
        ...data,
        create_date: new Date(),
      },
    });

    return NextResponse.json(newPart, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create part" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = (await request.json()) as parts;

    if (!data.id) {
      return NextResponse.json(
        { error: "Part ID is required for update" },
        { status: 400 },
      );
    }

    const updatedPart = await prisma.parts.update({
      where: { id: data.id },
      data: data,
    });

    return NextResponse.json(updatedPart);
  } catch {
    return NextResponse.json(
      { error: "Failed to update part" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id, cadfile } = (await request.json()) as {
      id: string;
      cadfile?: string;
    };

    if (!id) {
      return NextResponse.json(
        { error: "Part ID is required for deletion" },
        { status: 400 },
      );
    }

    await prisma.parts.delete({
      where: { id: id },
    });

    if (cadfile) {
      try {
        await rustfs_client.send(
          new DeleteObjectCommand({
            Bucket: "parts",
            Key: cadfile,
          }),
        );
      } catch (error) {
        console.error("Failed to delete CAD file:", error);
      }
    }

    return NextResponse.json({ message: "Part deleted successfully" });
  } catch (error) {
    console.error("Failed to delete part:", error);

    return NextResponse.json(
      { error: "Failed to delete part" },
      { status: 500 },
    );
  }
}
