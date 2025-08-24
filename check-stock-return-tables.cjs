const sql = require('mssql');

const config = {
  server: 'SYED-FAZLI-LAPT',
  database: 'InventoryManagementDB',
  user: 'inventoryuser',
  password: '1978Jupiter87@#',
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  requestTimeout: 30000,
  connectionTimeout: 30000
};

async function checkTables() {
  try {
    await sql.connect(config);
    
    // Check if stock_returns table exists
    const stockReturnsCheck = await sql.query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'stock_returns'
    `);
    
    // Check if stock_return_items table exists
    const stockReturnItemsCheck = await sql.query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'stock_return_items'
    `);
    
    console.log('stock_returns table exists:', stockReturnsCheck.recordset[0].count > 0);
    console.log('stock_return_items table exists:', stockReturnItemsCheck.recordset[0].count > 0);
    
    // If tables don't exist, create them
    const stockReturnsExists = stockReturnsCheck.recordset[0].count > 0;
    const stockReturnItemsExists = stockReturnItemsCheck.recordset[0].count > 0;
    
    if (!stockReturnsExists) {
      console.log('Creating stock_returns table...');
      await sql.query(`
        CREATE TABLE stock_returns (
          id INT IDENTITY(1,1) PRIMARY KEY,
          return_date DATE NOT NULL,
          returned_by NVARCHAR(255) NOT NULL,
          verified_by NVARCHAR(255),
          return_notes NVARCHAR(MAX),
          return_status NVARCHAR(50) DEFAULT 'Completed',
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
        )
      `);
      console.log('stock_returns table created successfully');
    }
    
    if (!stockReturnItemsExists) {
      console.log('Creating stock_return_items table...');
      await sql.query(`
        CREATE TABLE stock_return_items (
          id INT IDENTITY(1,1) PRIMARY KEY,
          return_id INT NOT NULL,
          issued_item_id NVARCHAR(255) NOT NULL,
          nomenclature NVARCHAR(500) NOT NULL,
          return_quantity INT NOT NULL,
          condition_on_return NVARCHAR(100) NOT NULL,
          damage_description NVARCHAR(MAX),
          created_at DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (return_id) REFERENCES stock_returns(id) ON DELETE CASCADE
        )
      `);
      console.log('stock_return_items table created successfully');
    }
    
    await sql.close();
    console.log('Table check completed');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkTables();
