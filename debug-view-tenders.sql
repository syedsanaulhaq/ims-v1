-- Debug View_tenders and find the specific tender
-- Check if the tender exists in the base table
SELECT 
    'Base tenders table' as source,
    COUNT(*) as total_count
FROM tenders;

-- Check specific tender in base table
SELECT 
    'Specific tender in base table' as check_type,
    id, title, reference_number, is_finalized, created_at
FROM tenders 
WHERE id = '28EB7589-0B47-4C42-90D3-75F7F1AC20D1';

-- Check View_tenders structure and count
SELECT 
    'View_tenders' as source,
    COUNT(*) as total_count
FROM View_tenders;

-- Check specific tender in view
SELECT 
    'Specific tender in view' as check_type,
    *
FROM View_tenders 
WHERE id = '28EB7589-0B47-4C42-90D3-75F7F1AC20D1';

-- Check if there are any case sensitivity issues by searching with UPPER
SELECT 
    'Case insensitive search in view' as check_type,
    *
FROM View_tenders 
WHERE UPPER(CAST(id as NVARCHAR(50))) = UPPER('28EB7589-0B47-4C42-90D3-75F7F1AC20D1');

-- List first few records from View_tenders to see structure
SELECT TOP 5 
    'Sample View_tenders records' as info,
    id, title, reference_number, office_name, wing_name
FROM View_tenders
ORDER BY created_at DESC;

-- Check View_tenders definition if possible
SELECT 
    OBJECT_DEFINITION(OBJECT_ID('View_tenders')) as view_definition;
