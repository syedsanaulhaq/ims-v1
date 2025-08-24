-- Check what tender_status values exist in the database
SELECT DISTINCT tender_status, COUNT(*) as count
FROM tenders 
GROUP BY tender_status
ORDER BY count DESC;

-- Check specific tender data with is_finalized values
SELECT TOP 10 
    id, 
    title, 
    tender_status, 
    is_finalized, 
    finalized_at
FROM tenders 
ORDER BY created_at DESC;
