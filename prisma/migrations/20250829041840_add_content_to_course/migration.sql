/*
  Warnings:

  - You are about to drop the column `description` on the `Course` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Course" DROP COLUMN "description",
ADD COLUMN     "content" JSONB,
ADD COLUMN     "keywords" JSONB,
ADD COLUMN     "learningObjectives" JSONB,
ADD COLUMN     "prerequisites" JSONB,
ADD COLUMN     "targetAudience" TEXT;
