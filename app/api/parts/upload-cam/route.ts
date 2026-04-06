import { NextResponse } from "next/server";
import rustfs_client from "@/lib/rustfs";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const partId = formData.get("partId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
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
    console.error("Failed to upload CAM file:", error);

    return NextResponse.json(
      {
        error:
          "Failed to upload CAM file: " +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { cadFilePath } = (await request.json()) as {
      cadFilePath?: string;
    };

    if (!cadFilePath) {
      return NextResponse.json(
        { error: "No CAM file path provided" },
        { status: 400 },
      );
    }

    const s3Response = await rustfs_client.send(
      new DeleteObjectCommand({
        Bucket: "parts",
        Key: cadFilePath,
      }),
    );

    const statusCode = s3Response.$metadata.httpStatusCode;

    if (statusCode !== 200 && statusCode !== 204) {
      return NextResponse.json(
        { error: "Failed to delete CAM file" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "CAM file deleted" }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete CAM file:", error);

    return NextResponse.json(
      { error: "Failed to delete CAM file" },
      { status: 500 },
    );
  }
}
