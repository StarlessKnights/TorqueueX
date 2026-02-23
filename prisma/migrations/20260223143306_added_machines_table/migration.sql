-- CreateEnum
CREATE TYPE "part_status" AS ENUM ('NEEDS_CAD', 'NEEDS_CAM', 'NEEDS_3D_PRINTING', 'NEEDS_ORDERING', 'NEEDS_MACHINING', 'NEEDS_PROCESSING', 'NEEDS_ASSEMBLY', 'COMPLETE');

-- CreateTable
CREATE TABLE "parts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "status" "part_status" NOT NULL DEFAULT 'NEEDS_CAD',
    "material" TEXT,
    "machine" TEXT,
    "endmill" TEXT,
    "needed" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "project" TEXT,
    "creator" TEXT NOT NULL,
    "create_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "part_number" INTEGER NOT NULL,
    "due_date" TIMESTAMPTZ(6),

    CONSTRAINT "parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machines" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);
