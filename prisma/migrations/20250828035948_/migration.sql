-- CreateEnum
CREATE TYPE "public"."LearningStyle" AS ENUM ('VISUAL', 'AUDITORY', 'KINESTHETIC', 'READ_WRITE', 'MIXED');

-- AlterTable
ALTER TABLE "public"."Lesson" ADD COLUMN     "content" TEXT,
ADD COLUMN     "difficulty" INTEGER,
ADD COLUMN     "prerequisites" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "resourceType" TEXT,
ADD COLUMN     "topics" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "public"."LessonProgress" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "interactionData" JSONB;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "learningGoals" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "learningStyle" "public"."LearningStyle",
ADD COLUMN     "passwordChangedAt" TIMESTAMP(3);
