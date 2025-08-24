-- REMOVE CORRECT PROBLEMATIC FIELDS: pricing_method and total_item_amount
-- This script removes the actual problematic fields from the database

-- Step 1: Remove pricing_method from all tables
DO $$ 
BEGIN
    -- Remove pricing_method from deliveries table if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'pricing_method') THEN
        ALTER TABLE deliveries DROP COLUMN pricing_method;
        RAISE NOTICE 'Removed pricing_method column from deliveries table';
    END IF;
    
    -- Remove pricing_method from tenders table if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'pricing_method') THEN
        ALTER TABLE tenders DROP COLUMN pricing_method;
        RAISE NOTICE 'Removed pricing_method column from tenders table';
    END IF;
    
    -- Remove pricing_method from delivery_items table if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_items' AND column_name = 'pricing_method') THEN
        ALTER TABLE delivery_items DROP COLUMN pricing_method;
        RAISE NOTICE 'Removed pricing_method column from delivery_items table';
    END IF;
END $$;

-- Step 2: Remove total_item_amount from all tables
DO $$ 
BEGIN
    -- Remove total_item_amount from delivery_items table if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_items' AND column_name = 'total_item_amount') THEN
        ALTER TABLE delivery_items DROP COLUMN total_item_amount;
        RAISE NOTICE 'Removed total_item_amount column from delivery_items table';
    END IF;
    
    -- Remove total_item_amount from deliveries table if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'total_item_amount') THEN
        ALTER TABLE deliveries DROP COLUMN total_item_amount;
        RAISE NOTICE 'Removed total_item_amount column from deliveries table';
    END IF;
    
    -- Remove total_item_amount from tenders table if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'total_item_amount') THEN
        ALTER TABLE tenders DROP COLUMN total_item_amount;
        RAISE NOTICE 'Removed total_item_amount column from tenders table';
    END IF;
END $$;

-- Step 3: Drop any indexes for these specific fields
DO $$ 
BEGIN
    -- Drop pricing_method indexes
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_deliveries_pricing_method') THEN
        DROP INDEX idx_deliveries_pricing_method;
        RAISE NOTICE 'Dropped idx_deliveries_pricing_method index';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tenders_pricing_method') THEN
        DROP INDEX idx_tenders_pricing_method;
        RAISE NOTICE 'Dropped idx_tenders_pricing_method index';
    END IF;
    
    -- Drop total_item_amount indexes
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_delivery_items_total_item_amount') THEN
        DROP INDEX idx_delivery_items_total_item_amount;
        RAISE NOTICE 'Dropped idx_delivery_items_total_item_amount index';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_deliveries_total_item_amount') THEN
        DROP INDEX idx_deliveries_total_item_amount;
        RAISE NOTICE 'Dropped idx_deliveries_total_item_amount index';
    END IF;
END $$;

-- Step 4: Drop any constraints for these specific fields
DO $$ 
BEGIN
    -- Drop pricing_method constraints
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_pricing_method') THEN
        ALTER TABLE deliveries DROP CONSTRAINT chk_pricing_method;
        RAISE NOTICE 'Dropped chk_pricing_method constraint from deliveries';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pricing_method_validation') THEN
        ALTER TABLE deliveries DROP CONSTRAINT pricing_method_validation;
        RAISE NOTICE 'Dropped pricing_method_validation constraint from deliveries';
    END IF;
END $$;

-- Step 5: Verification - Show that the specific fields were removed
SELECT 'CLEANUP COMPLETE' as status, 'Removed pricing_method and total_item_amount fields only' as message;

-- Show deliveries table structure to confirm cleanup
SELECT 'DELIVERIES TABLE AFTER CLEANUP' as info, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'deliveries'
ORDER BY ordinal_position;

-- Show delivery_items table structure to confirm cleanup
SELECT 'DELIVERY_ITEMS TABLE AFTER CLEANUP' as info, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'delivery_items'
ORDER BY ordinal_position;
