// Simple database query test component
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function DatabaseTest() {
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function testQueries() {
      try {
        console.log('Testing direct database queries...');
        
        // Test 1: Query deliveries table directly
        const { data: deliveries, error: deliveryError } = await supabase
          .from('deliveries')
          .select('*')
          .limit(5);
        
        if (deliveryError) {
          console.error('Direct deliveries query error:', deliveryError);
          setError(`Deliveries query error: ${deliveryError.message}`);
          return;
        }
        
        console.log('Direct deliveries query result:', deliveries);
        
        // Test 2: Query delivery_items table directly  
        const { data: items, error: itemsError } = await supabase
          .from('delivery_items')
          .select('*')
          .limit(5);
          
        if (itemsError) {
          console.error('Direct delivery_items query error:', itemsError);
          setError(`Delivery items query error: ${itemsError.message}`);
          return;
        }
        
        console.log('Direct delivery_items query result:', items);
        
        // Test 3: Try the RPC function
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_tender_deliveries', { p_tender_id: '00000000-0000-0000-0000-000000000000' });
          
        console.log('RPC function test:', { data: rpcData, error: rpcError });
        
        setResults({
          deliveriesCount: deliveries?.length || 0,
          itemsCount: items?.length || 0,
          sampleDelivery: deliveries?.[0],
          sampleItem: items?.[0],
          rpcTest: { data: rpcData, error: rpcError?.message }
        });
        
      } catch (err) {
        console.error('Test error:', err);
        setError(`Test error: ${err}`);
      }
    }
    
    testQueries();
  }, []);

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <h3 className="font-bold">Database Test Error:</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
      <h3 className="font-bold">Database Test Results:</h3>
      <pre className="mt-2 text-xs overflow-auto">
        {JSON.stringify(results, null, 2)}
      </pre>
    </div>
  );
}
