/*
  # Add launching_at field to products

  1. Changes
    - Add `launching_at` timestamp column to products table
    - Allows makers to schedule product launches
    - Null by default (immediate availability)
    - Used for countdown timers on homepage
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'launching_at'
  ) THEN
    ALTER TABLE products ADD COLUMN launching_at timestamptz;
    CREATE INDEX IF NOT EXISTS idx_products_launching_at ON products(launching_at) WHERE launching_at IS NOT NULL;
  END IF;
END $$;