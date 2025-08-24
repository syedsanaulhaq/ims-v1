-- Verify what items are actually in current_inventory_stock table
-- This will help identify if HP ENVY 6, iPhone, Desktop Computer should be in the results

-- Check all items in current_inventory_stock with their details
SELECT 
    cis.id,
    cis.current_quantity,
    cis.available_quantity,
    cis.minimum_stock_level,
    cis.reorder_point,
    im.nomenclature,
    im.unit
FROM current_inventory_stock cis
LEFT JOIN item_masters im ON cis.item_master_id = im.id
ORDER BY im.nomenclature;

-- Specifically check for the mentioned items
SELECT 
    cis.id,
    cis.current_quantity,
    cis.available_quantity,
    cis.minimum_stock_level,
    cis.reorder_point,
    im.nomenclature,
    im.unit
FROM current_inventory_stock cis
LEFT JOIN item_masters im ON cis.item_master_id = im.id
WHERE im.nomenclature ILIKE '%HP ENVY%' 
   OR im.nomenclature ILIKE '%iPhone%' 
   OR im.nomenclature ILIKE '%Desktop Computer%'
ORDER BY im.nomenclature;

-- Check if there are any orphaned records (items in current_inventory_stock without matching item_masters)
SELECT 
    cis.id,
    cis.item_master_id,
    cis.current_quantity,
    'No matching item_master' as issue
FROM current_inventory_stock cis
LEFT JOIN item_masters im ON cis.item_master_id = im.id
WHERE im.id IS NULL;
