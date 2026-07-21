-- DropForeignKey
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_project_id_fkey";

-- AlterTable
ALTER TABLE "jobs" ALTER COLUMN "project_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
