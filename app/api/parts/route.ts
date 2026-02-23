import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
