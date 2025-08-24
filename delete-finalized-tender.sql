-- Query to Delete a Finalized Tender
-- Tender ID: 98eb032a-86ac-4829-abd3-9c922398840f
-- WARNING: This will permanently delete all data related to this tender

-- Step 1: First delete from stock_transactions_clean (child table)
DELETE FROM stock_transactions_clean 
WHERE tender_id = '98eb032a-86ac-4829-abd3-9c922398840f';

-- Step 2: Delete from tender_items (if exists)
DELETE FROM tender_items 
WHERE tender_id = '98eb032a-86ac-4829-abd3-9c922398840f';

-- Step 3: Finally delete from tenders (parent table)
DELETE FROM tenders 
WHERE id = '98eb032a-86ac-4829-abd3-9c922398840f' AND is_finalized = 1;

-- Optional: Verify the deletion
SELECT 
    'Tender deleted successfully' as message,
    COUNT(*) as remaining_records
FROM tenders 
WHERE id = '98eb032a-86ac-4829-abd3-9c922398840f';

-- To check the tender details before deletion:
SELECT id, reference_number, title, is_finalized, created_at 
FROM tenders 
WHERE id = '98eb032a-86ac-4829-abd3-9c922398840f';

-- To check how many stock transactions will be deleted:
SELECT COUNT(*) as stock_transactions_to_delete
FROM stock_transactions_clean 
WHERE tender_id = '98eb032a-86ac-4829-abd3-9c922398840f';
