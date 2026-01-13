-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "target_date" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bark_key" TEXT;
