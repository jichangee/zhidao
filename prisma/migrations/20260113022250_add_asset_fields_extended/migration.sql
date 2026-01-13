-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "asset_type" TEXT DEFAULT '未分类',
ADD COLUMN     "exclude_from_daily_avg" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "exclude_from_total" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "is_pinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "purchase_date" TIMESTAMP(3),
ADD COLUMN     "purchase_price" DECIMAL(15,2),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT '服役中',
ADD COLUMN     "tags" TEXT,
ADD COLUMN     "target_cost" DECIMAL(15,2),
ADD COLUMN     "target_cost_type" TEXT DEFAULT '不设定';
