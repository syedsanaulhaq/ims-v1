-- REMOVE SPECIFIC PRICING FIELDS ONLY
-- This script removes only the specific fields: individual_total and actual_price_total
-- It does NOT remove all pricing functionality, just these two problematic fields

-- Remove individual_total and actual_price_total from StockAcquisitionForm state
-- These fields should not be in the frontend component

-- Step 1: Check if individual_total exists in any tables and remove it
DO $$ 
BEGIN
    -- Remove individual_total from deliveries table if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'individual_total') THEN
        ALTER TABLE deliveries DROP COLUMN individual_total;
        RAISE NOTICE 'Removed individual_total column from deliveries table';
    END IF;
    
    -- Remove individual_total from tenders table if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'individual_total') THEN
        ALTER TABLE tenders DROP COLUMN individual_total;
        RAISE NOTICE 'Removed individual_total column from tenders table';
    END IF;
    
    -- Remove individual_total from delivery_items table if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_items' AND column_name = 'individual_total') THEN
        ALTER TABLE delivery_items DROP COLUMN individual_total;
        RAISE NOTICE 'Removed individual_total column from delivery_items table';
    END IF;
END $$;

-- Step 2: Check if actual_price_total exists in any tables and remove it
DO $$ 
BEGIN
    -- Remove actual_price_total from deliveries table if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'actual_price_total') THEN
        ALTER TABLE deliveries DROP COLUMN actual_price_total;
        RAISE NOTICE 'Removed actual_price_total column from deliveries table';
    END IF;
    
    -- Remove actual_price_total from tenders table if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'actual_price_total') THEN
        ALTER TABLE tenders DROP COLUMN actual_price_total;
        RAISE NOTICE 'Removed actual_price_total column from tenders table';
    END IF;
    
    -- Remove actual_price_total from delivery_items table if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_items' AND column_name = 'actual_price_total') THEN
        ALTER TABLE delivery_items DROP COLUMN actual_price_total;
        RAISE NOTICE 'Removed actual_price_total column from delivery_items table';
    END IF;
END $$;

-- Step 3: Drop any indexes related to these specific fields
DO $$ 
BEGIN
    -- Drop individual_total indexes
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_deliveries_individual_total') THEN
        DROP INDEX idx_deliveries_individual_total;
        RAISE NOTICE 'Dropped idx_deliveries_individual_total index';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tenders_individual_total') THEN
        DROP INDEX idx_tenders_individual_total;
        RAISE NOTICE 'Dropped idx_tenders_individual_total index';
    END IF;
    
    -- Drop actual_price_total indexes
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_deliveries_actual_price_total') THEN
        DROP INDEX idx_deliveries_actual_price_total;
        RAISE NOTICE 'Dropped idx_deliveries_actual_price_total index';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tenders_actual_price_total') THEN
        DROP INDEX idx_tenders_actual_price_total;
        RAISE NOTICE 'Dropped idx_tenders_actual_price_total index';
    END IF;
END $$;

-- Step 4: Verify the cleanup - Show what was removed
SELECT 'CLEANUP COMPLETE' as status, 'Removed individual_total and actual_price_total fields only' as message;

-- Show current table structures to verify cleanup
SELECT 'DELIVERIES TABLE' as info, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'deliveries'
ORDER BY ordinal_position;

SELECT 'TENDERS TABLE' as info, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tenders'
ORDER BY ordinal_position;
