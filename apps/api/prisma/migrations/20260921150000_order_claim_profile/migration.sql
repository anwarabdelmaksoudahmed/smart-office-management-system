-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "claimed_by_id" UUID;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "claimed_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_claimed_by_id_idx" ON "orders"("claimed_by_id");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_claimed_by_id_fkey'
  ) THEN
    ALTER TABLE "orders"
      ADD CONSTRAINT "orders_claimed_by_id_fkey"
      FOREIGN KEY ("claimed_by_id") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
