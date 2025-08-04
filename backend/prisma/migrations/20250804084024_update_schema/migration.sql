/*
  Warnings:

  - Added the required column `file_type` to the `Option` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reviewCount` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceType` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Made the column `title` on table `Task` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Worker` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ServiceType" AS ENUM ('MARKETING_IMAGES', 'YOUTUBE_THUMBNAILS', 'VIDEOS');

-- CreateEnum
CREATE TYPE "public"."FileType" AS ENUM ('IMAGE', 'VIDEO');

-- DropForeignKey
ALTER TABLE "public"."Option" DROP CONSTRAINT "Option_task_id_fkey";

-- AlterTable
ALTER TABLE "public"."Option" ADD COLUMN     "file_type" "public"."FileType" NOT NULL,
ADD COLUMN     "ipfs_hash" TEXT,
ADD COLUMN     "video_url" TEXT,
ALTER COLUMN "image_url" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Payouts" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "processedAt" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'Processing';

-- AlterTable
ALTER TABLE "public"."Submission" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."Task" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "reviewCount" INTEGER NOT NULL,
ADD COLUMN     "serviceType" "public"."ServiceType" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "title" SET NOT NULL,
ALTER COLUMN "title" SET DEFAULT 'Select the most clickable content';

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."Worker" ADD COLUMN     "accuracy_score" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "tasks_completed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_earned" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "pending_amount" SET DEFAULT 0,
ALTER COLUMN "locked_amount" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."UserSession" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkerSession" (
    "id" SERIAL NOT NULL,
    "workerId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkerWithdrawal" (
    "id" SERIAL NOT NULL,
    "workerId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "signature" TEXT NOT NULL,
    "status" "public"."TxnStatus" NOT NULL DEFAULT 'Processing',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "WorkerWithdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TaskResult" (
    "id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OptionResult" (
    "id" SERIAL NOT NULL,
    "option_id" INTEGER NOT NULL,
    "task_result_id" INTEGER NOT NULL,
    "vote_count" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OptionResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemStats" (
    "id" SERIAL NOT NULL,
    "total_workers" INTEGER NOT NULL DEFAULT 0,
    "active_workers" INTEGER NOT NULL DEFAULT 0,
    "total_tasks_completed" INTEGER NOT NULL DEFAULT 0,
    "total_earnings_paid" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_token_key" ON "public"."UserSession"("token");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerSession_token_key" ON "public"."WorkerSession"("token");

-- CreateIndex
CREATE UNIQUE INDEX "TaskResult_task_id_key" ON "public"."TaskResult"("task_id");

-- AddForeignKey
ALTER TABLE "public"."UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkerSession" ADD CONSTRAINT "WorkerSession_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "public"."Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkerWithdrawal" ADD CONSTRAINT "WorkerWithdrawal_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "public"."Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Option" ADD CONSTRAINT "Option_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskResult" ADD CONSTRAINT "TaskResult_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OptionResult" ADD CONSTRAINT "OptionResult_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "public"."Option"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OptionResult" ADD CONSTRAINT "OptionResult_task_result_id_fkey" FOREIGN KEY ("task_result_id") REFERENCES "public"."TaskResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
