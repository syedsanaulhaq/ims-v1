const bcrypt = require('bcryptjs');

async function generatePasswordHashes() {
  console.log('🔐 Generating bcrypt password hashes...\n');
  
  const passwords = [
    { name: 'admin123', value: 'admin123' },
    { name: 'manager123', value: 'manager123' },
    { name: 'user123', value: 'user123' },
    { name: 'approver123', value: 'approver123' },
    { name: '123456', value: '123456' }
  ];
  
  console.log('-- Update SQL with proper bcrypt hashes');
  console.log('');
  
  for (const pwd of passwords) {
    const hash = await bcrypt.hash(pwd.value, 10);
    console.log(`-- Password: ${pwd.name}`);
    console.log(`UPDATE AspNetUsers SET PasswordHash = '${hash}' WHERE Password = '${pwd.value}';`);
    console.log('');
  }
  
  console.log('-- Test verification');
  const testHash = await bcrypt.hash('admin123', 10);
  const isValid = await bcrypt.compare('admin123', testHash);
  console.log(`bcrypt.compare('admin123', hash) = ${isValid}`);
}

generatePasswordHashes();
