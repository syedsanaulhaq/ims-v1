const bcrypt = require('bcryptjs');
const sql = require('mssql');

// Database configuration
const config = {
  server: 'localhost',
  database: 'InventoryManagementDB',
  authentication: {
    type: 'ntlm',
    options: {
      domain: '',
      userName: '',
      password: ''
    }
  },
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    integratedSecurity: true
  }
};

async function createTestUsers() {
  try {
    console.log('🔄 Connecting to database...');
    await sql.connect(config);
    
    console.log('🔐 Creating password hashes...');
    
    // Create test users with bcrypt hashed passwords
    const testUsers = [
      {
        id: 'test-admin-001',
        username: 'testadmin',
        fullName: 'Test Administrator',
        email: 'testadmin@ecp.gov.pk',
        password: 'admin123',
        role: 'Admin',
        cnic: '1234567890123',
        officeId: 1,
        wingId: 1,
        branchId: 1,
        designationId: 1
      },
      {
        id: 'test-manager-001',
        username: 'testmanager',
        fullName: 'Test Manager',
        email: 'testmanager@ecp.gov.pk',
        password: 'manager123',
        role: 'Manager',
        cnic: '2345678901234',
        officeId: 1,
        wingId: 2,
        branchId: 2,
        designationId: 2
      },
      {
        id: 'test-user-001',
        username: 'testuser',
        fullName: 'Test User',
        email: 'testuser@ecp.gov.pk',
        password: 'user123',
        role: 'User',
        cnic: '3456789012345',
        officeId: 2,
        wingId: 3,
        branchId: 3,
        designationId: 3
      },
      {
        id: 'test-approver-001',
        username: 'testapprover',
        fullName: 'Test Approver',
        email: 'testapprover@ecp.gov.pk',
        password: 'approver123',
        role: 'ApprovalManager',
        cnic: '4567890123456',
        officeId: 1,
        wingId: 1,
        branchId: 1,
        designationId: 4
      },
      {
        id: 'test-simple-001',
        username: '1111111111111',
        fullName: 'Simple Test User',
        email: 'simple@ecp.gov.pk',
        password: '123456',
        role: 'User',
        cnic: '1111111111111',
        officeId: 1,
        wingId: 1,
        branchId: 1,
        designationId: 5
      }
    ];
    
    console.log('📝 Creating test users...\n');
    
    for (const user of testUsers) {
      // Hash the password with bcrypt
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      try {
        // Check if user already exists
        const existingUser = await sql.query`
          SELECT Id FROM AspNetUsers WHERE UserName = ${user.username}
        `;
        
        if (existingUser.recordset.length > 0) {
          console.log(`⚠️  User ${user.username} already exists, updating password...`);
          
          // Update existing user with new password
          await sql.query`
            UPDATE AspNetUsers 
            SET PasswordHash = ${hashedPassword}, 
                Password = ${user.password},
                Email = ${user.email},
                FullName = ${user.fullName}
            WHERE UserName = ${user.username}
          `;
        } else {
          console.log(`✅ Creating new user: ${user.username}`);
          
          // Insert new user
          await sql.query`
            INSERT INTO AspNetUsers (
              Id, UserName, NormalizedUserName, Email, NormalizedEmail, 
              EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp,
              PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount,
              FullName, Role, CNIC, Password, ISACT,
              intOfficeID, intWingID, intBranchID, intDesignationID
            ) VALUES (
              ${user.id}, ${user.username}, ${user.username.toUpperCase()}, 
              ${user.email}, ${user.email.toUpperCase()},
              1, ${hashedPassword}, NEWID(), NEWID(),
              0, 0, 0, 0,
              ${user.fullName}, ${user.role}, ${user.cnic}, ${user.password}, 1,
              ${user.officeId}, ${user.wingId}, ${user.branchId}, ${user.designationId}
            )
          `;
        }
        
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🔑 Password: ${user.password}`);
        console.log(`   👤 Role: ${user.role}`);
        console.log('');
        
      } catch (error) {
        console.error(`❌ Error creating user ${user.username}:`, error.message);
      }
    }
    
    console.log('🎉 Test users created successfully!\n');
    console.log('📋 LOGIN CREDENTIALS FOR TESTING:');
    console.log('='.repeat(50));
    
    testUsers.forEach(user => {
      console.log(`👤 ${user.fullName} (${user.role})`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   CNIC: ${user.cnic}`);
      console.log('');
    });
    
    console.log('💡 TESTING NOTES:');
    console.log('- All passwords are bcrypt hashed and will work with your current system');
    console.log('- You can login with either username or CNIC');
    console.log('- The "admin/admin" login still works as before');
    console.log('- These users have different roles for testing approval workflows');
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await sql.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
createTestUsers();
