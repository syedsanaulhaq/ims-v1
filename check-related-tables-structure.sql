-- Check the structure of related tables
SELECT 
    'DEC_MST' as table_name,
    COLUMN_NAME,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'DEC_MST'
ORDER BY ORDINAL_POSITION;

SELECT 
    'tblOffices' as table_name,
    COLUMN_NAME,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'tblOffices'
ORDER BY ORDINAL_POSITION;

SELECT 
    'WingsInformation' as table_name,
    COLUMN_NAME,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'WingsInformation'
ORDER BY ORDINAL_POSITION;

-- Check sample data
SELECT TOP 3 * FROM DEC_MST;
SELECT TOP 3 * FROM tblOffices;
SELECT TOP 3 * FROM WingsInformation;

-- Check sample tender data to see the format of IDs
SELECT TOP 3 office_ids, wing_ids, dec_ids FROM tenders WHERE office_ids IS NOT NULL OR wing_ids IS NOT NULL OR dec_ids IS NOT NULL;
