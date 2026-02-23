import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const machines = await prisma.machines.findMany();

    console.log("Fetched machines:", machines);

    return NextResponse.json(machines);
  } catch (error) {
    console.error("Failed to fetch machines:", error);

    return NextResponse.json(
      { error: "Failed to fetch machines" },
      { status: 500 },
    );
  }
}
