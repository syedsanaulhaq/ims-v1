-- Remove stock transaction records for the last 2 tenders
-- This will clean up the stock_transaction_clean table

-- First, let's identify the last 2 tenders
WITH LastTwoTenders AS (
    SELECT TOP 2 id, tender_number
    FROM tenders 
    ORDER BY created_at DESC
)
SELECT 
    t.id as tender_id,
    t.tender_number,
    COUNT(stc.id) as stock_transaction_count
FROM LastTwoTenders t
LEFT JOIN stock_transaction_clean stc ON stc.tender_id = t.id
GROUP BY t.id, t.tender_number
ORDER BY t.tender_number;

-- Now delete the stock transaction records for these tenders
WITH LastTwoTenders AS (
    SELECT TOP 2 id
    FROM tenders 
    ORDER BY created_at DESC
)
DELETE FROM stock_transaction_clean 
WHERE tender_id IN (SELECT id FROM LastTwoTenders);

-- Verify the deletion
WITH LastTwoTenders AS (
    SELECT TOP 2 id, tender_number
    FROM tenders 
    ORDER BY created_at DESC
)
SELECT 
    t.id as tender_id,
    t.tender_number,
    COUNT(stc.id) as remaining_stock_transaction_count
FROM LastTwoTenders t
LEFT JOIN stock_transaction_clean stc ON stc.tender_id = t.id
GROUP BY t.id, t.tender_number
ORDER BY t.tender_number;
