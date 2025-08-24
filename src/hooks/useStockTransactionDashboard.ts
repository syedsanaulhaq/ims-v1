import { useQuery } from '@tanstack/react-query';

export interface StockTransactionDashboardStats {
  totalTenders: number;
  activeTenders: number;
  finalizedTenders: number;
  totalItems: number;
  totalQuantity: number;
  tendersWithStockTransactions: number;
  tendersWithoutStockTransactions: number;
  acquisitionStats: {
    'Contract/Tender': {
      count: number;
      items: number;
      quantity: number;
    };
    'Spot Purchase': {
      count: number;
      items: number;
      quantity: number;
    };
  };
  // New separated arrays
  tendersWithStock: Array<{
    id: string;
    title: string;
    tenderNumber: string;
    acquisitionType: 'Contract/Tender' | 'Spot Purchase';
    is_finalized: boolean;
    createdAt: string;
    itemCount: number;
    totalQuantity: number;
    hasStockTransactions: boolean;
    status: string;
  }>;
  tendersAwaitingStock: Array<{
    id: string;
    title: string;
    tenderNumber: string;
    acquisitionType: 'Contract/Tender' | 'Spot Purchase';
    is_finalized: boolean;
    createdAt: string;
    itemCount: number;
    totalQuantity: number;
    hasStockTransactions: boolean;
    status: string;
  }>;
  // Keep backwards compatibility
  recentTenders: Array<{
    id: string;
    title: string;
    tenderNumber: string;
    acquisitionType: 'Contract/Tender' | 'Spot Purchase';
    is_finalized: boolean;
    createdAt: string;
    itemCount: number;
    totalQuantity: number;
    hasStockTransactions?: boolean;
    status?: string;
  }>;
}

export const useStockTransactionDashboard = () => {
  const {
    data: stats,
    isLoading,
    error,
    isError
  } = useQuery({
    queryKey: ['stock-transaction-dashboard-stats-v2'], // Updated key to force refresh
    queryFn: async () => {
      const response = await fetch('http://localhost:3001/api/stock-transaction-dashboard-stats');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    },
    staleTime: 0, // Always fetch fresh data for now
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });

  const dashboardStats: StockTransactionDashboardStats = stats || {
    totalTenders: 0,
    activeTenders: 0,
    finalizedTenders: 0,
    totalItems: 0,
    totalQuantity: 0,
    tendersWithStockTransactions: 0,
    tendersWithoutStockTransactions: 0,
    acquisitionStats: {
      'Contract/Tender': { count: 0, items: 0, quantity: 0 },
      'Spot Purchase': { count: 0, items: 0, quantity: 0 }
    },
    tendersWithStock: [],
    tendersAwaitingStock: [],
    recentTenders: []
  };

  // Ensure acquisitionStats exists even if API doesn't return it
  if (dashboardStats.acquisitionStats === undefined) {
    dashboardStats.acquisitionStats = {
      'Contract/Tender': { count: 0, items: 0, quantity: 0 },
      'Spot Purchase': { count: 0, items: 0, quantity: 0 }
    };
  }

  return {
    stats: dashboardStats,
    isLoading,
    error,
    isError,
    isSuccess: !isError && !isLoading
  };
};
