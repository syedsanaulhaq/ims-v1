-- Clean up stock transactions for last 2 tenders
-- This script will remove all stock_transaction_clean records for the most recent 2 tenders

-- Step 1: Check current state before deletion
PRINT 'Current state before deletion:';
SELECT 
    t.tender_number,
    t.id as tender_id,
    COUNT(stc.id) as stock_transaction_count,
    STRING_AGG(stc.item_master_id, ', ') as item_master_ids
FROM (
    SELECT TOP 2 id, tender_number, created_at
    FROM tenders 
    ORDER BY created_at DESC
) t
LEFT JOIN stock_transaction_clean stc ON stc.tender_id = t.id
GROUP BY t.id, t.tender_number, t.created_at
ORDER BY t.created_at DESC;

-- Step 2: Delete stock transactions for the last 2 tenders
DECLARE @DeletedCount INT;

WITH LastTwoTenders AS (
    SELECT TOP 2 id
    FROM tenders 
    ORDER BY created_at DESC
)
DELETE FROM stock_transaction_clean 
WHERE tender_id IN (SELECT id FROM LastTwoTenders);

SET @DeletedCount = @@ROWCOUNT;
PRINT CONCAT('Deleted ', @DeletedCount, ' stock transaction records');

-- Step 3: Verify deletion
PRINT 'State after deletion:';
SELECT 
    t.tender_number,
    t.id as tender_id,
    COUNT(stc.id) as remaining_stock_transaction_count
FROM (
    SELECT TOP 2 id, tender_number, created_at
    FROM tenders 
    ORDER BY created_at DESC
) t
LEFT JOIN stock_transaction_clean stc ON stc.tender_id = t.id
GROUP BY t.id, t.tender_number, t.created_at
ORDER BY t.created_at DESC;

-- Step 4: Show all remaining stock transactions
PRINT 'All remaining stock transactions:';
SELECT 
    stc.tender_id,
    t.tender_number,
    stc.item_master_id,
    stc.created_at
FROM stock_transaction_clean stc
INNER JOIN tenders t ON t.id = stc.tender_id
ORDER BY stc.created_at DESC;
