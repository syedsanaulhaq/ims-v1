-- Check the structure of View_tenders
SELECT TOP 1 * FROM View_tenders;

-- Check the column names in View_tenders
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'View_tenders'
ORDER BY ORDINAL_POSITION;
