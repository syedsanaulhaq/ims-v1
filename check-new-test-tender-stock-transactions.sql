-- Check if "new test tender" has items in stock_transaction_clean table

-- First, find the "new test tender"
PRINT 'Looking for "new test tender":';
SELECT 
    id,
    tender_number,
    tender_title,
    created_at,
    updated_at
FROM tenders 
WHERE tender_number LIKE '%test%' 
   OR tender_title LIKE '%test%'
   OR tender_number LIKE '%new%'
   OR tender_title LIKE '%new%'
ORDER BY created_at DESC;

-- Check stock transactions for any tender containing "test" or "new"
PRINT 'Stock transactions for test/new tenders:';
SELECT 
    t.tender_number,
    t.tender_title,
    t.id as tender_id,
    stc.id as stock_transaction_id,
    stc.item_master_id,
    stc.total_quantity_received,
    stc.estimated_unit_price,
    stc.actual_unit_price,
    stc.pricing_confirmed,
    stc.is_deleted,
    stc.created_at as stock_transaction_created
FROM tenders t
LEFT JOIN stock_transaction_clean stc ON stc.tender_id = t.id
WHERE (t.tender_number LIKE '%test%' 
    OR t.tender_title LIKE '%test%'
    OR t.tender_number LIKE '%new%'
    OR t.tender_title LIKE '%new%')
ORDER BY t.created_at DESC, stc.created_at DESC;

-- Check tender items for these tenders
PRINT 'Tender items for test/new tenders:';
SELECT 
    t.tender_number,
    t.tender_title,
    t.id as tender_id,
    ti.id as tender_item_id,
    ti.item_master_id,
    ti.nomenclature,
    ti.quantity,
    ti.estimated_unit_price,
    ti.created_at as tender_item_created
FROM tenders t
INNER JOIN tender_items ti ON ti.tender_id = t.id
WHERE (t.tender_number LIKE '%test%' 
    OR t.tender_title LIKE '%test%'
    OR t.tender_number LIKE '%new%'
    OR t.tender_title LIKE '%new%')
ORDER BY t.created_at DESC, ti.created_at;

-- Compare tender items vs stock transactions for test tenders
PRINT 'Comparison: Tender Items vs Stock Transactions for test/new tenders:';
WITH TestTenders AS (
    SELECT id, tender_number, tender_title
    FROM tenders 
    WHERE tender_number LIKE '%test%' 
       OR tender_title LIKE '%test%'
       OR tender_number LIKE '%new%'
       OR tender_title LIKE '%new%'
),
TenderItemCounts AS (
    SELECT 
        tt.id as tender_id,
        tt.tender_number,
        tt.tender_title,
        COUNT(ti.id) as tender_item_count
    FROM TestTenders tt
    LEFT JOIN tender_items ti ON ti.tender_id = tt.id
    GROUP BY tt.id, tt.tender_number, tt.tender_title
),
StockTransactionCounts AS (
    SELECT 
        tt.id as tender_id,
        COUNT(stc.id) as stock_transaction_count
    FROM TestTenders tt
    LEFT JOIN stock_transaction_clean stc ON stc.tender_id = tt.id AND stc.is_deleted = 0
    GROUP BY tt.id
)
SELECT 
    tic.tender_number,
    tic.tender_title,
    tic.tender_id,
    tic.tender_item_count,
    ISNULL(stc.stock_transaction_count, 0) as stock_transaction_count,
    CASE 
        WHEN tic.tender_item_count = ISNULL(stc.stock_transaction_count, 0) THEN 'MATCH'
        WHEN tic.tender_item_count > ISNULL(stc.stock_transaction_count, 0) THEN 'MISSING STOCK TRANSACTIONS'
        ELSE 'EXTRA STOCK TRANSACTIONS'
    END as status
FROM TenderItemCounts tic
LEFT JOIN StockTransactionCounts stc ON stc.tender_id = tic.tender_id
ORDER BY tic.tender_number;
