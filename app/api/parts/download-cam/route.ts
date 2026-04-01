import { NextResponse } from "next/server";
import rustfs_client from "@/lib/rustfs";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cadFile = searchParams.get("file");

    if (!cadFile) {
      return NextResponse.json(
        { error: "No file path provided" },
        { status: 400 },
      );
    }

    const response = await rustfs_client.send(
      new GetObjectCommand({
        Bucket: "parts",
        Key: cadFile,
      }),
    );

    if (response.$metadata.httpStatusCode !== 200) {
      return NextResponse.json(
        { error: "Failed to download CAD file" },
        { status: 500 },
      );
    }

    if (!response.Body) {
      return NextResponse.json(
        { error: "No file data returned" },
        { status: 500 },
      );
    }

    const body = await response.Body.transformToByteArray();

    return new NextResponse(Buffer.from(body), {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${cadFile.split("/").pop()}"`,
      },
    });
  } catch (error) {
    console.error("Failed to download CAD file:", error);

    return NextResponse.json(
      { error: "Failed to download CAD file: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    );
  }
}
