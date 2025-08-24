interface StockReturnItem {
  issued_item_id: string;
  nomenclature: string;
  return_quantity: number;
  condition_on_return: string;
  damage_description?: string;
}

interface StockReturn {
  return_date: string;
  returned_by: string;
  verified_by?: string;
  return_notes?: string;
  return_status: string;
  return_items: StockReturnItem[];
}

class StockReturnService {
  private baseUrl = 'http://localhost:3001/api/stock-returns';

  async createReturn(stockReturn: StockReturn): Promise<any> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stockReturn),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Created stock return with ${stockReturn.return_items.length} items`);
      return result;
    } catch (error) {
      console.error('❌ Error creating stock return:', error);
      throw error;
    }
  }

  async getReturns(): Promise<any[]> {
    try {
      const response = await fetch(this.baseUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const returns = await response.json();
      console.log(`✅ Retrieved ${returns.length} stock returns from SQL Server`);
      return returns;
    } catch (error) {
      console.error('❌ Error fetching stock returns:', error);
      throw error;
    }
  }

  async getReturnById(id: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const stockReturn = await response.json();
      console.log(`✅ Retrieved stock return ${id} from SQL Server`);
      return stockReturn;
    } catch (error) {
      console.error('❌ Error fetching stock return:', error);
      throw error;
    }
  }
}

export default new StockReturnService();
export const stockReturnService = new StockReturnService();
export type { StockReturn, StockReturnItem };
