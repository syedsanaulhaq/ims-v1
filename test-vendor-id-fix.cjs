// Test script to verify vendor_id is being sent correctly to the backend
const testTenderWithVendor = async () => {
  const tenderData = {
    tender_spot_type: 'Contract/Tender',
    type: 'Contract/Tender',
    title: 'Test Tender with Vendor ID',
    referenceNumber: 'TEST-VENDOR-001',
    description: 'Testing vendor_id functionality',
    estimatedValue: 50000,
    publishDate: new Date().toISOString(),
    publicationDate: new Date().toISOString(),
    submissionDate: new Date().toISOString(),
    submissionDeadline: new Date().toISOString(),
    openingDate: new Date().toISOString(),
    officeIds: ['1'],
    wingIds: ['1'],
    decIds: ['1'],
    vendor_id: '12345678-1234-1234-1234-123456789012', // Test vendor ID
    items: [
      {
        itemMasterId: '11111111-1111-1111-1111-111111111111',
        nomenclature: 'Test Item',
        quantity: 10,
        estimatedUnitPrice: 100,
        specifications: 'Test specifications',
        remarks: 'Test remarks'
      }
    ]
  };

  try {
    console.log('🚀 Testing tender creation with vendor_id...');
    console.log('📋 Sending data with vendor_id:', tenderData.vendor_id);
    
    const response = await fetch('http://localhost:3001/api/tenders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tenderData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS: Tender created successfully');
      console.log('📄 Response:', result);
    } else {
      console.log('❌ FAILED: Error creating tender');
      console.log('📄 Error:', result);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
};

// Test with vendor object (new vendor creation)
const testTenderWithNewVendor = async () => {
  const tenderData = {
    tender_spot_type: 'Contract/Tender',
    type: 'Contract/Tender',
    title: 'Test Tender with New Vendor',
    referenceNumber: 'TEST-VENDOR-002',
    description: 'Testing new vendor creation',
    estimatedValue: 75000,
    publishDate: new Date().toISOString(),
    publicationDate: new Date().toISOString(),
    submissionDate: new Date().toISOString(),
    submissionDeadline: new Date().toISOString(),
    openingDate: new Date().toISOString(),
    officeIds: ['1'],
    wingIds: ['1'],
    decIds: ['1'],
    vendor: {
      vendorId: '',
      vendorName: 'Test Vendor Company',
      contactPerson: 'John Doe',
      email: 'john@testvendor.com',
      phone: '+1234567890',
      address: '123 Test Street',
      contractValue: 75000,
      contractDate: new Date().toISOString(),
      remarks: 'Test vendor creation'
    },
    items: [
      {
        itemMasterId: '11111111-1111-1111-1111-111111111111',
        nomenclature: 'Test Item',
        quantity: 15,
        estimatedUnitPrice: 150,
        specifications: 'Test specifications',
        remarks: 'Test remarks'
      }
    ]
  };

  try {
    console.log('\n🚀 Testing tender creation with new vendor...');
    console.log('📋 Sending data with vendor object:', tenderData.vendor.vendorName);
    
    const response = await fetch('http://localhost:3001/api/tenders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tenderData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS: Tender created successfully');
      console.log('📄 Response:', result);
    } else {
      console.log('❌ FAILED: Error creating tender');
      console.log('📄 Error:', result);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
};

// Run tests
const runTests = async () => {
  console.log('🧪 Starting vendor_id fix tests...\n');
  
  await testTenderWithVendor();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
  await testTenderWithNewVendor();
  
  console.log('\n✅ Tests completed!');
};

runTests();
