import { NextResponse } from "next/server";
import rustfs_client from "@/lib/rustfs";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const partId = formData.get("partId") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 },
      );
    }

    if (!partId) {
      return NextResponse.json(
        { error: "No partId provided" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const s3Response = await rustfs_client.send(
      new PutObjectCommand({
        Bucket: "parts",
        Key: `${partId}/${file.name}`,
        Body: uint8Array,
        ContentType: file.type,
      }),
    );

    if (s3Response.$metadata.httpStatusCode !== 200) {
      return NextResponse.json(
        { error: "Failed to upload file to S3" },
        { status: 500 },
      );
    }

    const cadFilePath = `${partId}/${file.name}`;

    return NextResponse.json({ cadFilePath }, { status: 200 });
  } catch (error) {
    console.error("Failed to upload CAD file:", error);

    return NextResponse.json(
      { error: "Failed to upload CAD file: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    );
  }
}
