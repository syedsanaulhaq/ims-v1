import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, 
  ArrowLeft, 
  Search,
  RefreshCw,
  TrendingDown,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { InventoryService, type InventoryItem } from '@/services/inventoryService';

interface AlertItem extends InventoryItem {
  alertType: 'critical' | 'urgent' | 'warning';
  alertMessage: string;
}

const InventoryAlertsPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [alertItems, setAlertItems] = useState<AlertItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlertType, setSelectedAlertType] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    processAlerts();
  }, [items]);

  useEffect(() => {
    filterItems();
  }, [alertItems, searchTerm, selectedAlertType]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const result = await InventoryService.getInventoryData();
      setItems(result.data);
    } catch (error) {
      console.error('Error loading inventory items:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAlerts = () => {
    const alerts: AlertItem[] = [];

    items.forEach(item => {
      let alertType: 'critical' | 'urgent' | 'warning' | null = null;
      let alertMessage = '';

      // Critical - Out of Stock
      if (item.current_stock <= 0) {
        alertType = 'critical';
        alertMessage = 'OUT OF STOCK - Immediate action required';
      }
      // Urgent - Below Reorder Point
      else if (item.reorder_point > 0 && item.current_stock <= item.reorder_point) {
        alertType = 'urgent';
        alertMessage = `Below reorder point (${item.reorder_point} ${item.unit})`;
      }
      // Warning - Low Stock (Below Minimum but above reorder point)
      else if (item.minimum_stock_level > 0 && item.current_stock <= item.minimum_stock_level) {
        alertType = 'warning';
        alertMessage = `Low stock - Below minimum level (${item.minimum_stock_level} ${item.unit})`;
      }

      if (alertType) {
        alerts.push({
          ...item,
          alertType,
          alertMessage
        });
      }
    });

    // Sort by alert priority: critical -> urgent -> warning
    alerts.sort((a, b) => {
      const priorityOrder = { critical: 0, urgent: 1, warning: 2 };
      return priorityOrder[a.alertType] - priorityOrder[b.alertType];
    });

    setAlertItems(alerts);
  };

  const filterItems = () => {
    let filtered = alertItems;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by alert type
    if (selectedAlertType !== 'all') {
      filtered = filtered.filter(item => item.alertType === selectedAlertType);
    }

    setFilteredItems(filtered);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  const getAlertCounts = () => {
    return {
      critical: alertItems.filter(item => item.alertType === 'critical').length,
      urgent: alertItems.filter(item => item.alertType === 'urgent').length,
      warning: alertItems.filter(item => item.alertType === 'warning').length,
    };
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'critical':
        return <XCircle className="h-4 w-4" />;
      case 'urgent':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlertColor = (alertType: string) => {
    switch (alertType) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'urgent':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const alertTypeOptions = [
    { value: 'all', label: 'All Alerts' },
    { value: 'critical', label: 'Critical' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'warning', label: 'Warning' },
  ];

  const alertCounts = getAlertCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard/inventory-dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              Inventory Alerts
            </h1>
            <p className="text-gray-600">Items requiring immediate attention ({alertItems.length} alerts)</p>
          </div>
        </div>
        <Button onClick={loadItems} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Critical</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{alertCounts.critical}</div>
            <p className="text-xs text-red-600">Out of stock items</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Urgent</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{alertCounts.urgent}</div>
            <p className="text-xs text-orange-600">Below reorder point</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Warning</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{alertCounts.warning}</div>
            <p className="text-xs text-yellow-600">Below minimum level</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search items by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="min-w-[150px]">
              <select
                value={selectedAlertType}
                onChange={(e) => setSelectedAlertType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {alertTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Active Alerts</span>
            <Badge variant="outline">{filteredItems.length} alerts</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No alerts found matching your criteria</p>
              </div>
            ) : (
              filteredItems.map((item, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-4 border rounded-lg ${getAlertColor(item.alertType)}`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    {getAlertIcon(item.alertType)}
                    <div className="flex-1">
                      <div className="font-medium">{item.item_name}</div>
                      <div className="text-sm mt-1">{item.alertMessage}</div>
                      <div className="text-xs mt-2 space-x-4">
                        <span>Current: {formatNumber(item.current_stock)} {item.unit}</span>
                        {item.minimum_stock_level > 0 && (
                          <span>Min: {formatNumber(item.minimum_stock_level)} {item.unit}</span>
                        )}
                        {item.reorder_point > 0 && (
                          <span>Reorder: {formatNumber(item.reorder_point)} {item.unit}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={
                        item.alertType === 'critical' ? 'destructive' :
                        item.alertType === 'urgent' ? 'secondary' : 'outline'
                      }
                      className="text-xs"
                    >
                      {item.alertType.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryAlertsPage;
