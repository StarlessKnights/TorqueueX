import { S3Client } from "@aws-sdk/client-s3";

const rustfs_client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.RUSTFS_ACCESS_KEY || "",
    secretAccessKey: process.env.RUSTFS_SECRET_KEY || "",
  },
  endpoint: "http://localhost:9000",
  forcePathStyle: true,
});

export default rustfs_client;
