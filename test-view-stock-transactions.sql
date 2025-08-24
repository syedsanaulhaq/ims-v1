-- Test query for the new View_stock_transactions_clean
-- This will help us see the structure and data in the view

SELECT TOP 5 
    tender_id,
    item_master_id,
    actual_unit_price,
    total_quantity_received,
    estimated_unit_price,
    pricing_confirmed,
    is_deleted,
    created_at
FROM View_stock_transactions_clean 
WHERE tender_id = '8A0C1D2F-9740-45C3-914F-C6F901FDF492'
AND is_deleted = 0
ORDER BY created_at DESC;

-- Also get the full structure of the view
SELECT TOP 1 * FROM View_stock_transactions_clean 
WHERE tender_id = '8A0C1D2F-9740-45C3-914F-C6F901FDF492';
