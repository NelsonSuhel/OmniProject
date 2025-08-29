/*
  Warnings:

  - The `description` column on the `Lesson` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `title` on the `Lesson` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."Lesson" DROP COLUMN "title",
ADD COLUMN     "title" JSONB NOT NULL,
DROP COLUMN "description",
ADD COLUMN     "description" JSONB;
