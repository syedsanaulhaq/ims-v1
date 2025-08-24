import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDateDMY } from '@/utils/dateUtils';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  Package,
  AlertCircle,
  MessageSquare,
  Send,
  Eye,
  FileText
} from 'lucide-react';
import approvalService, { ApprovalRequest, ApprovalItem, ApprovalAction } from '@/services/approvalService';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface IssuanceRequest {
  id: string;
  request_number: string;
  request_type: string;
  requester_name: string;
  requester_email: string;
  requester_department: string;
  purpose: string;
  urgency_level: string;
  request_status: string;
  submitted_at: string;
  expected_return_date: string;
  is_returnable: boolean;
  items: RequestItem[];
  total_items: number;
  total_quantity: number;
  total_value: number;
  has_custom_items?: boolean;
  inventory_items?: RequestItem[];
  custom_items?: RequestItem[];
}

interface RequestItem {
  id: string;
  item_master_id?: string;
  nomenclature: string;
  requested_quantity: number;
  approved_quantity?: number;
  unit_price: number;
  item_status: string;
  rejection_reason?: string;
  item_type: 'inventory' | 'custom';
  custom_item_name?: string;
  current_stock?: number;
  inventory_info?: any;
  stock_status?: 'sufficient' | 'insufficient' | 'out_of_stock' | 'unknown';
}

const ApprovalManagement: React.FC = () => {
  const [pendingRequests, setPendingRequests] = useState<IssuanceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<IssuanceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState('pending');

  // Approval form fields
  const [approverName, setApproverName] = useState('');
  const [approverDesignation, setApproverDesignation] = useState('');
  const [approvalComments, setApprovalComments] = useState('');
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject'>('approve');

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setIsLoading(true);
      
      const requests = await approvalService.getPendingRequests();
      
      // Transform to match the expected interface
      const transformedRequests = requests.map(request => ({
        ...request,
        id: request.id, // Already a string from the service
        items: request.items.map(item => ({
          ...item,
          id: item.id, // Already a string from the service
          item_type: (item.item_type === 'inventory' || item.item_type === 'custom') 
            ? item.item_type 
            : 'inventory' as 'inventory' | 'custom'
        })),
        inventory_items: request.inventory_items?.map(item => ({
          ...item,
          id: item.id,
          item_type: (item.item_type === 'inventory' || item.item_type === 'custom') 
            ? item.item_type 
            : 'inventory' as 'inventory' | 'custom'
        })),
        custom_items: request.custom_items?.map(item => ({
          ...item,
          id: item.id,
          item_type: (item.item_type === 'inventory' || item.item_type === 'custom') 
            ? item.item_type 
            : 'custom' as 'inventory' | 'custom'
        }))
      }));

      setPendingRequests(transformedRequests);
    } catch (error: any) {
      setError('Failed to load pending requests: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const variants = {
      'Critical': 'destructive',
      'High': 'secondary',
      'Normal': 'outline',
      'Low': 'outline'
    };
    return <Badge variant={variants[urgency as keyof typeof variants] as any}>{urgency}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'Submitted': 'secondary',
      'Under Review': 'default',
      'Approved': 'default',
      'Rejected': 'destructive'
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>{status}</Badge>;
  };

  const getStockStatusBadge = (stockStatus: string, currentStock: number | null, requestedQty: number) => {
    if (stockStatus === 'unknown') {
      return <Badge variant="outline" className="text-gray-500">Stock Unknown</Badge>;
    }
    
    switch (stockStatus) {
      case 'sufficient':
        return <Badge variant="default" className="bg-green-100 text-green-800">✓ Stock: {currentStock}</Badge>;
      case 'insufficient':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">⚠ Stock: {currentStock} (Need: {requestedQty})</Badge>;
      case 'out_of_stock':
        return <Badge variant="destructive">✗ Out of Stock</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const updateItemApproval = (itemId: string, approvedQty: number, status: string) => {
    if (!selectedRequest) return;
    
    const updatedItems = selectedRequest.items.map(item =>
      item.id === itemId ? { ...item, approved_quantity: approvedQty, item_status: status } : item
    );
    
    setSelectedRequest({ ...selectedRequest, items: updatedItems });
  };

  const processApproval = async (action: 'approve' | 'reject') => {
    if (!selectedRequest || !approverName) {
      setError('Please select a request and provide approver name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Generate item allocations based on the request items and action
      const itemAllocations = selectedRequest.items.map(item => ({
        requested_item_id: item.id,
        inventory_item_id: item.item_master_id,
        allocated_quantity: action === 'approve' ? (item.approved_quantity || item.requested_quantity) : 0,
        decision_type: action === 'approve' 
          ? (item.item_type === 'custom' ? 'APPROVE_FOR_PROCUREMENT' : 'APPROVE_FROM_STOCK')
          : 'REJECT' as 'APPROVE_FROM_STOCK' | 'APPROVE_FOR_PROCUREMENT' | 'REJECT',
        rejection_reason: action === 'reject' ? (approvalComments || 'Request rejected') : undefined,
        procurement_required_quantity: action === 'approve' && item.item_type === 'custom' 
          ? (item.approved_quantity || item.requested_quantity) 
          : undefined
      }));

      const approvalAction: ApprovalAction = {
        request_id: selectedRequest.id,
        approver_name: approverName,
        approver_designation: approverDesignation || 'Approver',
        approval_comments: approvalComments || `Request ${action}d by ${approverName}`,
        item_allocations: itemAllocations
      };

      let result;
      if (action === 'approve') {
        result = await approvalService.approveRequest(approvalAction);
      } else {
        result = await approvalService.rejectRequest(approvalAction);
      }

      if (result.success) {
        setSuccess(result.message);
        
        // Reset form and refresh data
        setSelectedRequest(null);
        setApproverName('');
        setApproverDesignation('');
        setApprovalComments('');
        fetchPendingRequests();
      } else {
        throw new Error(result.message || 'Failed to process approval');
      }
    } catch (error: any) {
      setError('Failed to process approval: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const quickApprove = async (request: IssuanceRequest) => {
    if (!approverName) {
      setError('Please set approver name first');
      return;
    }

    setSelectedRequest(request);
    await processApproval('approve');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Approval Management</h1>
          <p className="text-gray-600 mt-1">Review and approve stock issuance requests</p>
        </div>

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Requests List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Pending Approvals ({pendingRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Approver Info */}
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="approverName">Your Name *</Label>
                      <Input
                        id="approverName"
                        value={approverName}
                        onChange={(e) => setApproverName(e.target.value)}
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="approverDesignation">Designation</Label>
                      <Input
                        id="approverDesignation"
                        value={approverDesignation}
                        onChange={(e) => setApproverDesignation(e.target.value)}
                        placeholder="Your designation/title"
                      />
                    </div>
                  </div>
                </div>

                {/* Requests List */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {pendingRequests.map(request => (
                    <div 
                      key={request.id} 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedRequest?.id === request.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedRequest(request)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{request.request_number}</div>
                        <div className="flex items-center gap-2">
                          {getUrgencyBadge(request.urgency_level)}
                          {getStatusBadge(request.request_status)}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>👤 {request.requester_name} ({request.request_type})</div>
                        <div>📦 {request.total_items} items</div>
                        <div>📅 Submitted: {formatDateDMY(request.submitted_at)}</div>
                        <div className="text-xs mt-2 line-clamp-2">💬 {request.purpose}</div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); quickApprove(request); }}
                          disabled={!approverName || isLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Quick Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); setSelectedRequest(request); }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {pendingRequests.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No pending requests for approval</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Request Details & Approval */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Request Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedRequest ? (
                  <div className="space-y-4">
                    {/* Request Info */}
                    <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                      <div><strong>Request:</strong> {selectedRequest.request_number}</div>
                      <div><strong>Type:</strong> {selectedRequest.request_type}</div>
                      <div><strong>Requester:</strong> {selectedRequest.requester_name}</div>
                      <div><strong>Department:</strong> {selectedRequest.requester_department || 'Not specified'}</div>
                      <div><strong>Urgency:</strong> {getUrgencyBadge(selectedRequest.urgency_level)}</div>
                      {selectedRequest.is_returnable && (
                        <div><strong>Return Date:</strong> {formatDateDMY(selectedRequest.expected_return_date)}</div>
                      )}
                    </div>

                    <div>
                      <strong>Purpose:</strong>
                      <p className="text-sm text-gray-600 mt-1">{selectedRequest.purpose}</p>
                    </div>

                    {/* Items List - Separated by Type */}
                    <div className="space-y-4">
                      {/* Inventory Items */}
                      {selectedRequest.inventory_items && selectedRequest.inventory_items.length > 0 && (
                        <div>
                          <strong className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Inventory Items ({selectedRequest.inventory_items.length}):
                          </strong>
                          <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                            {selectedRequest.inventory_items.map(item => (
                              <div key={item.id} className="p-3 border rounded bg-blue-50 border-blue-200">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="font-medium">{item.nomenclature}</div>
                                  <Badge variant="default" className="text-xs">Inventory</Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-gray-600">Requested:</span> {item.requested_quantity}
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Current Stock:</span> {item.current_stock ?? 'Unknown'}
                                  </div>
                                </div>
                                
                                <div className="mt-2">
                                  {getStockStatusBadge(item.stock_status || 'unknown', item.current_stock, item.requested_quantity)}
                                </div>
                                
                                {item.stock_status === 'insufficient' && (
                                  <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                    ⚠️ Insufficient stock! You can approve with reduced quantity or reject for restocking.
                                  </div>
                                )}
                                
                                {item.stock_status === 'out_of_stock' && (
                                  <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                                    ❌ Out of stock! Consider rejecting or requesting restocking.
                                  </div>
                                )}
                                
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">Approve Qty</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      max={Math.min(item.requested_quantity, item.current_stock || 0)}
                                      value={item.approved_quantity || item.requested_quantity}
                                      onChange={(e) => updateItemApproval(item.id, parseInt(e.target.value) || 0, 'pending')}
                                      className="text-sm"
                                    />
                                  </div>
                                  <div className="text-xs text-gray-500 pt-4">
                                    Max available: {Math.min(item.requested_quantity, item.current_stock || 0)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Custom Items */}
                      {selectedRequest.custom_items && selectedRequest.custom_items.length > 0 && (
                        <div>
                          <strong className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                            Custom Items ({selectedRequest.custom_items.length}):
                          </strong>
                          <div className="space-y-2 mt-2">
                            {selectedRequest.custom_items.map(item => (
                              <div key={item.id} className="p-3 border rounded bg-orange-50 border-orange-200">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="font-medium">{item.custom_item_name || item.nomenclature}</div>
                                  <Badge variant="secondary" className="text-xs">Custom</Badge>
                                </div>
                                
                                <div className="text-sm text-gray-600 mb-2">
                                  Qty: {item.requested_quantity}
                                </div>
                                
                                <div className="p-2 bg-orange-100 border border-orange-300 rounded text-xs text-orange-800">
                                  📋 <strong>Custom Item Policy:</strong> This item will be automatically sent to the tender process for procurement. 
                                  No immediate approval needed - it will be handled through procurement workflow.
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Approval Actions */}
                    <div className="space-y-3">
                      {/* Custom Items Warning */}
                      {selectedRequest.has_custom_items && (
                        <Alert className="border-orange-200 bg-orange-50">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          <AlertDescription className="text-orange-800">
                            This request contains {selectedRequest.custom_items?.length} custom item(s). 
                            Upon approval, custom items will be automatically routed to the tender process for procurement.
                          </AlertDescription>
                        </Alert>
                      )}

                      <div>
                        <Label htmlFor="comments">Comments</Label>
                        <Textarea
                          id="comments"
                          value={approvalComments}
                          onChange={(e) => setApprovalComments(e.target.value)}
                          placeholder="Add comments about your decision, stock considerations, etc."
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => processApproval('approve')}
                          disabled={isLoading || !approverName}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {isLoading ? <LoadingSpinner /> : <CheckCircle className="w-4 h-4 mr-1" />}
                          {selectedRequest.has_custom_items ? 'Approve & Route Custom Items' : 'Approve'}
                        </Button>
                        <Button
                          onClick={() => processApproval('reject')}
                          disabled={isLoading || !approverName}
                          variant="destructive"
                          className="flex-1"
                        >
                          {isLoading ? <LoadingSpinner /> : <XCircle className="w-4 h-4 mr-1" />}
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Select a request to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalManagement;
