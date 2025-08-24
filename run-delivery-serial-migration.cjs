const { Client } = require('pg');
const fs = require('fs');

async function runMigration() {
  const client = new Client({
    host: 'db.euhthwosspivtzmqifsy.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: '2016Wfp61@#'
  });
  
  try {
    console.log('🔄 Creating delivery_item_serial_numbers table...');
    await client.connect();
    
    const sql = fs.readFileSync('create-delivery-serial-numbers-table.sql', 'utf8');
    await client.query(sql);
    
    console.log('✅ Successfully created delivery_item_serial_numbers table and policies');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  } finally {
    await client.end();
  }
}

runMigration().catch(console.error);
