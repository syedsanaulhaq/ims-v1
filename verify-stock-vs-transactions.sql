-- Check for items in current_inventory_stock that have no corresponding stock transactions
-- These are items that were added to inventory but never actually received

SELECT 
    cis.id,
    cis.current_quantity,
    cis.available_quantity,
    cis.minimum_stock_level,
    cis.reorder_point,
    im.nomenclature,
    im.unit,
    -- Check if there are any IN transactions for this item
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM stock_transactions st 
            WHERE st.item = im.nomenclature 
            AND st.type = 'IN'
        ) THEN 'HAS_TRANSACTIONS'
        ELSE 'NO_TRANSACTIONS'
    END as transaction_status,
    -- Get total IN quantity from transactions
    COALESCE((
        SELECT SUM(st.quantity) 
        FROM stock_transactions st 
        WHERE st.item = im.nomenclature 
        AND st.type = 'IN'
    ), 0) as total_received_qty,
    -- Get total OUT quantity from transactions  
    COALESCE((
        SELECT SUM(st.quantity) 
        FROM stock_transactions st 
        WHERE st.item = im.nomenclature 
        AND st.type = 'OUT'
    ), 0) as total_issued_qty
FROM current_inventory_stock cis
JOIN item_masters im ON cis.item_master_id = im.id
WHERE cis.current_quantity = 0 
   OR cis.available_quantity = 0
ORDER BY 
    CASE WHEN EXISTS (
        SELECT 1 FROM stock_transactions st 
        WHERE st.item = im.nomenclature 
        AND st.type = 'IN'
    ) THEN 1 ELSE 0 END,
    im.nomenclature;

-- Also check what's in the tenders table to see if these items are there
SELECT 
    t.tender_number,
    t.tender_title,
    t.status,
    ti.item_name,
    ti.quantity,
    ti.unit,
    ti.estimated_cost
FROM tenders t
JOIN tender_items ti ON t.id = ti.tender_id
WHERE ti.item_name IN ('iPhone', 'Desktop Computer', 'HP ENVY 6')
ORDER BY t.tender_number, ti.item_name;
