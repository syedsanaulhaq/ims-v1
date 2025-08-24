// Test script to check dashboard data from API
const axios = require('axios');

const testDashboardAPI = async () => {
  try {
    console.log('Testing API endpoints...');
    
    // Test tenders endpoint
    try {
      const tendersResponse = await axios.get('http://localhost:3001/api/tenders');
      const tenders = tendersResponse.data;
      console.log('Tenders data:', {
        count: tenders.length,
        sample: tenders.slice(0, 1)
      });
    } catch (err) {
      console.log('Tenders API error:', err.message);
    }

    // Test vendors endpoint
    try {
      const vendorsResponse = await axios.get('http://localhost:3001/api/vendors');
      const vendors = vendorsResponse.data;
      console.log('Vendors data:', {
        count: vendors.length,
        sample: vendors.slice(0, 1)
      });
    } catch (err) {
      console.log('Vendors API error:', err.message);
    }

    // Test item masters endpoint
    try {
      const itemsResponse = await axios.get('http://localhost:3001/api/item-masters');
      const items = itemsResponse.data;
      console.log('Items data:', {
        count: items.length,
        sample: items.slice(0, 1)
      });
    } catch (err) {
      console.log('Items API error:', err.message);
    }

    // Test stock transactions endpoint
    try {
      const stockResponse = await axios.get('http://localhost:3001/api/stock-transactions');
      const stockTransactions = stockResponse.data;
      console.log('Stock Transactions data:', {
        count: stockTransactions.length,
        sample: stockTransactions.slice(0, 1)
      });
    } catch (err) {
      console.log('Stock transactions API error:', err.message);
    }

    // Test deliveries endpoint
    try {
      const deliveriesResponse = await axios.get('http://localhost:3001/api/deliveries');
      const deliveries = deliveriesResponse.data;
      console.log('Deliveries data:', {
        count: deliveries.length,
        sample: deliveries.slice(0, 1)
      });
    } catch (err) {
      console.log('Deliveries API error:', err.message);
    }

  } catch (error) {
    console.error('Error testing API:', error);
  }
};

testDashboardAPI();
