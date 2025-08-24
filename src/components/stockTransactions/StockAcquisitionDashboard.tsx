import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  TrendingUp, 
  FileText, 
  Hash, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  BarChart3,
  PieChart,
  Plus,
  Edit,
  Trash2,
  Lock,
  Eye,
  Calendar,
  Search
} from "lucide-react";
import { useStockTransactionDashboard } from '@/hooks/useStockTransactionDashboard';

// Simple Chart Components
const SimpleBarChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="w-20 text-sm font-medium">{item.label}</div>
          <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
            <div 
              className="h-6 rounded-full flex items-center justify-end pr-2 text-white text-xs font-medium"
              style={{ 
                width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`, 
                backgroundColor: item.color,
                minWidth: item.value > 0 ? '30px' : '0px'
              }}
            >
              {item.value > 0 && item.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const SimplePieChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500">
        <div className="text-center">
          <PieChart className="h-8 w-8 mx-auto mb-2" />
          <div className="text-sm">No data available</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90">
            <circle
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke="#e5e7eb"
              strokeWidth="3"
            />
            {data.map((item, index) => {
              const offset = data.slice(0, index).reduce((sum, d) => sum + d.value, 0);
              const percentage = (item.value / total) * 100;
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              const strokeDashoffset = -offset / total * 100;
              
              return item.value > 0 ? (
                <circle
                  key={index}
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="3"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                />
              ) : null;
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">{total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm">{item.label}</span>
            </div>
            <span className="text-sm font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const StockAcquisitionDashboard: React.FC = () => {
  const { stats, isLoading, isError } = useStockTransactionDashboard();
  const navigate = useNavigate();
  
  // Filter state
  const [searchFilter, setSearchFilter] = useState('');

  // Helper function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  // Combine all tenders for the transactions table
  const allTenders = [...(stats?.tendersWithStock || []), ...(stats?.tendersAwaitingStock || [])];

  // Filter function to search across tender fields
  const filterTenders = (tenders: any[]) => {
    if (!searchFilter.trim()) return tenders;
    
    const searchTerm = searchFilter.toLowerCase();
    return tenders.filter(tender => 
      (tender.tenderNumber || '').toLowerCase().includes(searchTerm) ||
      (tender.title || '').toLowerCase().includes(searchTerm) ||
      (tender.acquisitionType || '').toLowerCase().includes(searchTerm) ||
      (tender.status || '').toLowerCase().includes(searchTerm) ||
      (formatDate(tender.createdAt) || '').toLowerCase().includes(searchTerm)
    );
  };

  // Separate and sort tenders by type, then apply filtering
  const contractTenders = useMemo(() => {
    const filtered = allTenders
      .filter(tender => tender.acquisitionType === 'Contract/Tender')
      .sort((a, b) => {
        // First sort by status priority (Active > Pending > Finalized)
        const getStatusPriority = (tender: any) => {
          if (tender.is_finalized) return 3; // Finalized - lowest priority
          if (tender.totalQuantity > 0) return 1; // Active - highest priority  
          return 2; // Pending - medium priority
        };
        
        const statusComparison = getStatusPriority(a) - getStatusPriority(b);
        if (statusComparison !== 0) return statusComparison;
        
        // Then sort by creation date descending (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    
    return filterTenders(filtered);
  }, [allTenders, searchFilter]);

  const spotPurchaseTenders = useMemo(() => {
    const filtered = allTenders
      .filter(tender => tender.acquisitionType === 'Spot Purchase')
      .sort((a, b) => {
        // First sort by status priority (Active > Pending > Finalized)
        const getStatusPriority = (tender: any) => {
          if (tender.is_finalized) return 3; // Finalized - lowest priority
          if (tender.totalQuantity > 0) return 1; // Active - highest priority
          return 2; // Pending - medium priority
        };
        
        const statusComparison = getStatusPriority(a) - getStatusPriority(b);
        if (statusComparison !== 0) return statusComparison;
        
        // Then sort by creation date descending (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    
    return filterTenders(filtered);
  }, [allTenders, searchFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading stock acquisitions...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load stock acquisition data</p>
        </div>
      </div>
    );
  }

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Helper function to render acquisition table
  const renderAcquisitionTable = (
    tenders: any[], 
    title: string, 
    description: string, 
    emptyMessage: string
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tenders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">{emptyMessage}</p>
            <Button
              onClick={() => navigate('/transaction-manager')}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Acquisition
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tender #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenders.map((tender) => (
                  <TableRow key={tender.id}>
                    <TableCell className="font-medium">
                      {tender.tenderNumber || 'N/A'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {tender.title || 'Untitled'}
                    </TableCell>
                    <TableCell>
                      {tender.itemCount || 0}
                    </TableCell>
                    <TableCell>
                      {tender.totalQuantity || 0}
                    </TableCell>
                    <TableCell>
                      {tender.is_finalized ? (
                        <Badge className="bg-blue-100 text-blue-800">
                          <Lock className="h-3 w-3 mr-1" />
                          Finalized
                        </Badge>
                      ) : (
                        <Badge variant={tender.totalQuantity > 0 ? "default" : "secondary"}>
                          {tender.totalQuantity > 0 ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </>
                          )}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        {formatDate(tender.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* Always show View Report button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewReport(tender)}
                          className="h-8 px-2"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>

                        {/* Show Edit, Delete, Finalize only if not finalized */}
                        {!tender.is_finalized && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(tender)}
                              className="h-8 px-2"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            
                            {tender.totalQuantity > 0 && (
                              <Button
                                size="sm"
                                onClick={() => handleFinalize(tender)}
                                className="h-8 px-2 bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Lock className="h-3 w-3" />
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(tender)}
                              className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Handle action buttons
  const handleEdit = (tender: any) => {
    navigate(`/transaction-manager?tenderId=${tender.id}`);
  };

  const handleViewReport = (tender: any) => {
    // Navigate directly to the stock acquisition report page
    navigate(`/dashboard/stock-acquisition/${tender.id}/report`);
  };

  const handleFinalize = async (tender: any) => {
    // This would typically open a confirmation dialog
    // For now, navigate to the transaction manager where finalize logic exists
    navigate(`/transaction-manager?tenderId=${tender.id}&action=finalize`);
  };

  const handleDelete = async (tender: any) => {
    // Show confirmation dialog
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the tender "${tender.title}"?\n\nThis action cannot be undone and will remove all associated stock transactions.`
    );
    
    if (!confirmDelete) {
      return;
    }

    try {
      // Delete all stock transactions for this tender first
      const stockResponse = await fetch(`http://localhost:3001/api/stock-transactions-clean?tender_id=${tender.id}`);
      if (stockResponse.ok) {
        const stockTransactions = await stockResponse.json();
        
        // Delete each stock transaction
        for (const transaction of stockTransactions) {
          await fetch(`http://localhost:3001/api/stock-transactions-clean/${tender.id}/${transaction.item_master_id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ deleted_by: 'user' })
          });
        }
      }

      // Delete the tender itself
      const tenderResponse = await fetch(`http://localhost:3001/api/tenders/${tender.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (tenderResponse.ok) {
        alert('Tender and associated stock transactions deleted successfully!');
        // Refresh the dashboard data
        window.location.reload();
      } else {
        throw new Error('Failed to delete tender');
      }
    } catch (error) {
      console.error('Error deleting tender:', error);
      alert('Failed to delete tender. Please try again.');
    }
  };

  // Prepare chart data for stock acquisitions
  const stockStatusData = [
    { label: 'Active Acquisitions', value: stats?.tendersWithStock?.length || 0, color: '#10b981' },
    { label: 'Pending Setup', value: stats?.tendersAwaitingStock?.length || 0, color: '#f59e0b' }
  ];

  // Acquisition Type Distribution - more meaningful than quantity ranges
  const acquisitionTypeData = [
    { 
      label: 'Contract/Tender', 
      value: allTenders.filter(t => t.acquisitionType === 'Contract/Tender').length, 
      color: '#3b82f6' 
    },
    { 
      label: 'Spot Purchase', 
      value: allTenders.filter(t => t.acquisitionType === 'Spot Purchase').length, 
      color: '#8b5cf6' 
    },
    { 
      label: 'Other', 
      value: allTenders.filter(t => !t.acquisitionType || (t.acquisitionType !== 'Contract/Tender' && t.acquisitionType !== 'Spot Purchase')).length, 
      color: '#6b7280' 
    }
  ].filter(item => item.value > 0); // Only show categories with data

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-600" />
            Stock Acquisition Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Manage stock transactions, view reports, and monitor acquisition status
          </p>
        </div>
        <div className="flex gap-3 ml-6">
          <Button
            onClick={() => navigate('/dashboard/transaction-manager')}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Stock Acquisition
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allTenders.reduce((sum, t) => sum + (t.itemCount || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Items across all acquisitions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Item Received</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {allTenders.reduce((sum, t) => sum + (t.totalQuantity || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Items received and available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Item Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.tendersAwaitingStock?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Acquisitions awaiting setup</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Acquisition Status
            </CardTitle>
            <CardDescription>
              Distribution of stock acquisitions by setup status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SimplePieChart data={stockStatusData} />
          </CardContent>
        </Card>

        {/* Acquisition Type Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Acquisition Types
            </CardTitle>
            <CardDescription>
              Distribution of acquisitions by acquisition method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={acquisitionTypeData} />
          </CardContent>
        </Card>
      </div>

      {/* Search Filter Section */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Stock Acquisitions</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search acquisitions..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
      </div>

      {/* Separate tables for Contract/Tender and Spot Purchase */}
      <div className="space-y-6">
        {renderAcquisitionTable(
          contractTenders,
          "Contract & Tender Acquisitions",
          "Manage contract-based and tender-based stock acquisitions",
          "No contract or tender acquisitions found"
        )}

        {renderAcquisitionTable(
          spotPurchaseTenders,
          "Spot Purchase Acquisitions", 
          "Manage direct spot purchase acquisitions",
          "No spot purchase acquisitions found"
        )}
      </div>
    </div>
  );
};

export default StockAcquisitionDashboard;
