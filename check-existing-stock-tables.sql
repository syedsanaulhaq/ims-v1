-- Check existing stock transaction tables and their structure
-- This will help us understand the current database state

-- Check all tables with 'stock' in the name
SELECT 
    TABLE_NAME,
    TABLE_SCHEMA,
    TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME LIKE '%stock%'
ORDER BY TABLE_NAME;

-- Check all tables with 'transaction' in the name
SELECT 
    TABLE_NAME,
    TABLE_SCHEMA,
    TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME LIKE '%transaction%'
ORDER BY TABLE_NAME;

-- If stock_transactions_clean exists (different name), show its structure
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'stock_transactions_clean')
BEGIN
    PRINT 'Found stock_transactions_clean table (with s)';
    SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'stock_transactions_clean'
    ORDER BY ORDINAL_POSITION;
END

-- If stock_transaction_clean exists (singular), show its structure  
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'stock_transaction_clean')
BEGIN
    PRINT 'Found stock_transaction_clean table (singular)';
    SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'stock_transaction_clean'
    ORDER BY ORDINAL_POSITION;
END

-- Show all existing views
SELECT 
    TABLE_NAME as VIEW_NAME,
    VIEW_DEFINITION
FROM INFORMATION_SCHEMA.VIEWS
WHERE TABLE_NAME LIKE '%stock%' OR TABLE_NAME LIKE '%transaction%'
ORDER BY TABLE_NAME;
