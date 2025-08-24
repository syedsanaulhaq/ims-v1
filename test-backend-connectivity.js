// Quick test to check backend connectivity from frontend context
fetch('http://localhost:3001/api/tenders')
  .then(response => {
    console.log('✅ Backend is reachable, status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('✅ Backend response:', data);
  })
  .catch(error => {
    console.error('❌ Backend connection failed:', error);
  });
