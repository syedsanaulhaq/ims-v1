-- Check DEC_MST table structure
SELECT 
    'DEC_MST' as table_name,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'DEC_MST'
ORDER BY ORDINAL_POSITION;

-- Check sample data to see what columns exist
SELECT TOP 3 * FROM DEC_MST;
