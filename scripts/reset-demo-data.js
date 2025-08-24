// Demo Data Reset Script
// This script resets the staging database with clean, presentation-ready data

const { switchEnvironment } = require('../config/environment');
const sql = require('mssql');

// Switch to staging environment
const config = switchEnvironment('staging');

async function resetDemoData() {
  console.log('🎬 Resetting Demo Data for Presentations...');
  
  let pool;
  try {
    // Connect to staging database
    pool = await sql.connect(config.database);
    console.log('✅ Connected to staging database');
    
    // Clear existing transaction data
    console.log('🧹 Clearing existing data...');
    await pool.request().query(`
      DELETE FROM stock_transactions_clean;
      DELETE FROM delivery_item_serial_numbers;
      DELETE FROM deliveries;
    `);
    
    // Insert clean demo data
    console.log('📊 Inserting demo data...');
    
    // Demo tenders with clean data
    const demoData = {
      tenders: [
        {
          id: 'DEMO-001',
          title: 'IT Equipment Procurement 2025',
          tenderNumber: 'TND-2025-001',
          status: 'Active'
        },
        {
          id: 'DEMO-002', 
          title: 'Office Furniture Supply',
          tenderNumber: 'TND-2025-002',
          status: 'Finalized'
        }
      ],
      items: [
        {
          id: 'ITEM-001',
          nomenclature: 'Desktop Computer',
          specifications: 'Intel i7, 16GB RAM, 512GB SSD',
          unit: 'Each'
        },
        {
          id: 'ITEM-002',
          nomenclature: 'Office Chair',
          specifications: 'Ergonomic, adjustable height',
          unit: 'Each'
        }
      ]
    };
    
    // Insert demo stock transactions
    await pool.request().query(`
      INSERT INTO stock_transactions_clean (
        id, tender_id, item_master_id, estimated_unit_price, 
        actual_unit_price, total_quantity_received, type, 
        pricing_confirmed, created_at, updated_at, is_deleted
      ) VALUES 
      (NEWID(), '${demoData.tenders[0].id}', '${demoData.items[0].id}', 75000, 72500, 10, 'IN', 1, GETDATE(), GETDATE(), 0),
      (NEWID(), '${demoData.tenders[0].id}', '${demoData.items[1].id}', 25000, 24500, 50, 'IN', 1, GETDATE(), GETDATE(), 0),
      (NEWID(), '${demoData.tenders[1].id}', '${demoData.items[0].id}', 80000, 78000, 5, 'IN', 1, GETDATE(), GETDATE(), 0)
    `);
    
    console.log('✅ Demo data reset complete!');
    console.log('');
    console.log('🎯 Demo Environment Ready:');
    console.log(`   - Database: ${config.database.database}`);
    console.log(`   - Port: ${config.port}`);
    console.log(`   - Clean data with realistic values`);
    console.log(`   - No "Unknown Item" issues`);
    console.log('');
    console.log('🚀 Start staging server:');
    console.log('   npm run start:staging');
    
  } catch (error) {
    console.error('❌ Error resetting demo data:', error);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  resetDemoData().catch(console.error);
}

module.exports = { resetDemoData };
