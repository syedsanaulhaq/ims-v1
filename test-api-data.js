// Quick diagnostic to check API data
fetch('http://localhost:3001/api/tenders')
  .then(res => res.json())
  .then(data => console.log('Tenders:', data?.length || 0, data?.slice(0,1)))
  .catch(err => console.log('Tenders error:', err));

fetch('http://localhost:3001/api/deliveries')
  .then(res => res.json())
  .then(data => console.log('Deliveries:', data?.length || 0, data?.slice(0,1)))
  .catch(err => console.log('Deliveries error:', err));

fetch('http://localhost:3001/api/item-masters')
  .then(res => res.json())
  .then(data => console.log('Item Masters:', data?.length || 0, data?.slice(0,1)))
  .catch(err => console.log('Item Masters error:', err));

fetch('http://localhost:3001/api/stock-issuance/requests')
  .then(res => res.json())
  .then(data => console.log('Stock Requests:', data?.length || 0, data?.slice(0,1)))
  .catch(err => console.log('Stock Requests error:', err));

fetch('http://localhost:3001/api/offices')
  .then(res => res.json())
  .then(data => console.log('Offices:', data?.length || 0, data?.slice(0,1)))
  .catch(err => console.log('Offices error:', err));

fetch('http://localhost:3001/api/users')
  .then(res => res.json())
  .then(data => console.log('Users:', data?.length || 0, data?.slice(0,1)))
  .catch(err => console.log('Users error:', err));
