import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { partId } = await request.json();

    console.log("Completing part:", partId);

    const part = await prisma.parts.findUnique({ where: { id: partId } });

    if (!part) {
      console.error("Part not found for completion:", partId);
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    if (part.needed > 1) {
      await prisma.parts.update({
        where: { id: partId },
        data: { needed: part.needed - 1 },
      });
    } else {
      await prisma.parts.update({
        where: { id: partId },
        data: { needed: 0, status: "COMPLETE" },
      });
    }

    return NextResponse.json({
      message: "Part updated successfully",
      newStatus: part.needed > 1 ? part.status : "COMPLETE",
      newNeeded: part.needed > 1 ? part.needed - 1 : 0,
    });
  } catch (error) {
    console.error("Failed to complete part:", error);
    return NextResponse.json(
      { error: "Failed to complete part" },
      { status: 500 },
    );
  }
}
