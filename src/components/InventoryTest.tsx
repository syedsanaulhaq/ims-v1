import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const InventoryTest: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔍 Testing inventory data fetch...');
        
        // Direct query to current_inventory_stock
        const { data: stockData, error: stockError } = await supabase
          .from('current_inventory_stock')
          .select(`
            id,
            current_quantity,
            available_quantity,
            item_masters!inner(
              nomenclature,
              unit
            )
          `)
          .order('current_quantity', { ascending: false })
          .limit(10);

        if (stockError) {
          console.error('❌ Error fetching stock data:', stockError);
          setError(stockError.message);
          return;
        }

        console.log('✅ Stock data fetched:', stockData);
        setData(stockData || []);
        
        // Also test delivery_items to see if there's data there
        const { data: deliveryData, error: deliveryError } = await supabase
          .from('delivery_items')
          .select('item_name, delivery_qty')
          .order('delivery_qty', { ascending: false })
          .limit(5);

        if (!deliveryError) {
          console.log('✅ Delivery data sample:', deliveryData);
        }
        
      } catch (err: any) {
        console.error('💥 Test failed:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading inventory test...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Inventory Data Test</h2>
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="text-lg font-semibold mb-2">
          Found {data.length} items in current_inventory_stock:
        </h3>
        {data.length === 0 ? (
          <p className="text-red-600">❌ No data found in current_inventory_stock table!</p>
        ) : (
          <ul className="space-y-2">
            {data.map((item, index) => {
              const itemMaster = Array.isArray(item.item_masters) 
                ? item.item_masters[0] 
                : item.item_masters;
              return (
                <li key={item.id} className="bg-white p-2 rounded">
                  <strong>{itemMaster?.nomenclature || 'Unknown'}</strong> - 
                  Current: {item.current_quantity}, 
                  Available: {item.available_quantity}
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-4 p-2 bg-blue-50 rounded">
          <p className="text-sm text-blue-800">
            Total stock: {data.reduce((sum, item) => sum + (item.current_quantity || 0), 0)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InventoryTest;
