-- Query to check the data relationship between stock_transactions_clean and item_masters
-- This will help us understand why item details are showing as "Unknown"

-- First, let's see what's in stock_transactions_clean
SELECT 
    'Stock Transactions' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT item_master_id) as unique_item_master_ids
FROM stock_transactions_clean;

-- Show sample item_master_ids from stock_transactions_clean
SELECT TOP 5
    'Sample stock_transactions item_master_ids' as info,
    item_master_id,
    tender_id,
    estimated_unit_price
FROM stock_transactions_clean
ORDER BY created_at DESC;

-- Now let's see what's in item_masters
SELECT 
    'Item Masters' as table_name,
    COUNT(*) as total_records
FROM item_masters;

-- Show sample IDs from item_masters
SELECT TOP 5
    'Sample item_masters ids' as info,
    id,
    nomenclature,
    unit
FROM item_masters;

-- Check for exact matches between the tables
SELECT 
    st.item_master_id as stock_transaction_item_id,
    im.id as item_master_id,
    im.nomenclature,
    CASE 
        WHEN im.id IS NOT NULL THEN 'MATCH FOUND'
        ELSE 'NO MATCH'
    END as match_status
FROM stock_transactions_clean st
LEFT JOIN item_masters im ON st.item_master_id = im.id
ORDER BY match_status, st.item_master_id;

-- Check data types and formats
SELECT 
    'Data Type Check' as info,
    'stock_transactions_clean.item_master_id' as column_name,
    item_master_id as sample_value,
    LEN(item_master_id) as value_length,
    SQL_VARIANT_PROPERTY(item_master_id, 'BaseType') as data_type
FROM stock_transactions_clean
WHERE item_master_id IS NOT NULL
UNION ALL
SELECT 
    'Data Type Check' as info,
    'item_masters.id' as column_name,
    CAST(id as VARCHAR(50)) as sample_value,
    LEN(CAST(id as VARCHAR(50))) as value_length,
    SQL_VARIANT_PROPERTY(id, 'BaseType') as data_type
FROM item_masters
WHERE id IS NOT NULL;
