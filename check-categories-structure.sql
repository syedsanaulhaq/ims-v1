-- Check the structure of categories and sub_categories tables
SELECT 
    'categories' as table_name,
    COLUMN_NAME,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'categories'
ORDER BY ORDINAL_POSITION;

SELECT 
    'sub_categories' as table_name,
    COLUMN_NAME,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'sub_categories'
ORDER BY ORDINAL_POSITION;

-- Also check a sample of the data
SELECT TOP 3 * FROM categories;
SELECT TOP 3 * FROM sub_categories;
