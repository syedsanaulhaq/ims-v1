-- Sync minimum stock level and reorder point from item_master to current_inventory_stock
-- This ensures both tables are on the same track for inventory management thresholds

-- First, let's see the current mismatches
SELECT 
    cis.id as stock_id,
    im.nomenclature,
    cis.minimum_stock_level as stock_min,
    im.minimum_stock_level as master_min,
    cis.reorder_point as stock_reorder,
    im.reorder_point as master_reorder,
    CASE 
        WHEN cis.minimum_stock_level != im.minimum_stock_level THEN 'MIN_MISMATCH'
        WHEN cis.reorder_point != im.reorder_point THEN 'REORDER_MISMATCH'
        ELSE 'MATCH'
    END as status
FROM current_inventory_stock cis
JOIN item_masters im ON cis.item_master_id = im.id
WHERE cis.minimum_stock_level != im.minimum_stock_level 
   OR cis.reorder_point != im.reorder_point
ORDER BY im.nomenclature;

-- Update current_inventory_stock with min/max values from item_master
UPDATE current_inventory_stock 
SET 
    minimum_stock_level = im.minimum_stock_level,
    reorder_point = im.reorder_point
FROM item_masters im 
WHERE current_inventory_stock.item_master_id = im.id
  AND (current_inventory_stock.minimum_stock_level != im.minimum_stock_level 
       OR current_inventory_stock.reorder_point != im.reorder_point);

-- Verify the sync worked
SELECT 
    COUNT(*) as total_items,
    COUNT(CASE WHEN cis.minimum_stock_level = im.minimum_stock_level THEN 1 END) as min_synced,
    COUNT(CASE WHEN cis.reorder_point = im.reorder_point THEN 1 END) as reorder_synced,
    COUNT(CASE WHEN cis.minimum_stock_level != im.minimum_stock_level 
                 OR cis.reorder_point != im.reorder_point THEN 1 END) as mismatches
FROM current_inventory_stock cis
JOIN item_masters im ON cis.item_master_id = im.id;

-- Create a trigger to keep them in sync going forward
CREATE OR REPLACE FUNCTION sync_inventory_thresholds()
RETURNS TRIGGER AS $$
BEGIN
    -- When item_master min/max values are updated, sync to current_inventory_stock
    IF TG_OP = 'UPDATE' AND (OLD.minimum_stock_level != NEW.minimum_stock_level 
                            OR OLD.reorder_point != NEW.reorder_point) THEN
        UPDATE current_inventory_stock 
        SET 
            minimum_stock_level = NEW.minimum_stock_level,
            reorder_point = NEW.reorder_point
        WHERE item_master_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on item_masters table
DROP TRIGGER IF EXISTS sync_inventory_thresholds_trigger ON item_masters;
CREATE TRIGGER sync_inventory_thresholds_trigger
    AFTER UPDATE ON item_masters
    FOR EACH ROW
    EXECUTE FUNCTION sync_inventory_thresholds();

-- Also create a function to sync when new items are added to current_inventory_stock
CREATE OR REPLACE FUNCTION sync_new_inventory_item()
RETURNS TRIGGER AS $$
BEGIN
    -- When new item is added to current_inventory_stock, get min/max from item_master
    IF TG_OP = 'INSERT' THEN
        SELECT minimum_stock_level, reorder_point 
        INTO NEW.minimum_stock_level, NEW.reorder_point
        FROM item_masters 
        WHERE id = NEW.item_master_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on current_inventory_stock table for new inserts
DROP TRIGGER IF EXISTS sync_new_inventory_item_trigger ON current_inventory_stock;
CREATE TRIGGER sync_new_inventory_item_trigger
    BEFORE INSERT ON current_inventory_stock
    FOR EACH ROW
    EXECUTE FUNCTION sync_new_inventory_item();

-- Show items that now have proper min/max values defined (> 0)
SELECT 
    cis.id,
    im.nomenclature,
    cis.current_quantity,
    cis.minimum_stock_level,
    cis.reorder_point,
    CASE 
        WHEN cis.minimum_stock_level > 0 AND cis.reorder_point > 0 THEN '✓ MANAGED'
        ELSE '✗ NOT_MANAGED'
    END as management_status
FROM current_inventory_stock cis
JOIN item_masters im ON cis.item_master_id = im.id
ORDER BY 
    CASE WHEN cis.minimum_stock_level > 0 AND cis.reorder_point > 0 THEN 0 ELSE 1 END,
    im.nomenclature;
