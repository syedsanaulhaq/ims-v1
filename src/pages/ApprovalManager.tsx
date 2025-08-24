import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Forward, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  MessageSquare,
  Calendar,
  AlertTriangle
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";

interface ApprovalAction {
  ActionType: string;
  ActionDate: string;
  UserName: string;
  Comments?: string;
  ForwardedToName?: string;
  Level: number;
}

interface PendingApproval {
  IssuanceId: number;
  IssuanceNumber: string;
  RequestedByName: string;
  RequestedByEmail: string;
  ForwardedFromName: string;
  ForwardReason: string;
  ForwardDate: string;
  Priority: string;
  DueDate?: string;
  Level: number;
  RequestDate: string;
  ApprovalStatus: string;
}

interface User {
  Id: string;
  FullName: string;
  UserName: string;
  Role: string;
  displayName: string;
  designation?: string;
}

const ApprovalManager: React.FC = () => {
  const { user } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalAction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  
  // Form states
  const [forwardToUserId, setForwardToUserId] = useState('');
  const [forwardReason, setForwardReason] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [dueDate, setDueDate] = useState('');
  const [comments, setComments] = useState('');
  const [isFinalApproval, setIsFinalApproval] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch pending approvals
  useEffect(() => {
    if (user?.Id) {
      fetchPendingApprovals();
      fetchUsers();
    }
  }, [user]);

  const fetchPendingApprovals = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/approvals/pending/${user?.Id}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPendingApprovals(data);
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/users/approvers', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchApprovalHistory = async (issuanceId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/approvals/history/${issuanceId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setApprovalHistory(data);
      }
    } catch (error) {
      console.error('Error fetching approval history:', error);
    }
  };

  const handleViewDetails = async (approval: PendingApproval) => {
    setSelectedApproval(approval);
    await fetchApprovalHistory(approval.IssuanceId);
  };

  const handleForward = async () => {
    if (!selectedApproval || !forwardToUserId || !forwardReason) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('http://localhost:3001/api/approvals/forward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          issuanceId: selectedApproval.IssuanceId,
          forwardedToUserId,
          forwardReason,
          priority,
          dueDate: dueDate || null,
          currentUserId: user?.Id
        })
      });

      if (response.ok) {
        toast.success('Approval forwarded successfully');
        setShowForwardDialog(false);
        resetFormStates();
        fetchPendingApprovals();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to forward approval');
      }
    } catch (error) {
      console.error('Error forwarding approval:', error);
      toast.error('Failed to forward approval');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApproval) return;

    setSubmitting(true);
    try {
      const response = await fetch('http://localhost:3001/api/approvals/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          issuanceId: selectedApproval.IssuanceId,
          comments,
          isFinalApproval,
          currentUserId: user?.Id
        })
      });

      if (response.ok) {
        toast.success(isFinalApproval ? 'Final approval completed' : 'Approval completed');
        setShowApproveDialog(false);
        resetFormStates();
        fetchPendingApprovals();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to approve');
      }
    } catch (error) {
      console.error('Error approving:', error);
      toast.error('Failed to approve');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApproval || !comments) {
      toast.error('Please provide rejection reason');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('http://localhost:3001/api/approvals/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          issuanceId: selectedApproval.IssuanceId,
          comments,
          currentUserId: user?.Id
        })
      });

      if (response.ok) {
        toast.success('Issuance rejected');
        setShowRejectDialog(false);
        resetFormStates();
        fetchPendingApprovals();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to reject');
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error('Failed to reject');
    } finally {
      setSubmitting(false);
    }
  };

  const resetFormStates = () => {
    setForwardToUserId('');
    setForwardReason('');
    setPriority('Normal');
    setDueDate('');
    setComments('');
    setIsFinalApproval(false);
    setSelectedApproval(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Normal': return 'bg-blue-100 text-blue-800';
      case 'Low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'FORWARDED': return <Forward className="h-4 w-4" />;
      case 'APPROVED': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'REJECTED': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'SUBMITTED': return <Clock className="h-4 w-4 text-blue-600" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Approval Manager</h1>
          <p className="text-gray-600">Manage your pending approvals and forwarding tasks</p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {pendingApprovals.length} Pending
        </Badge>
      </div>

      {pendingApprovals.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Approvals</h3>
            <p className="text-gray-600">You have no pending approval requests at this time.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {pendingApprovals.map((approval) => (
            <Card key={approval.IssuanceId} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      {approval.IssuanceNumber}
                    </CardTitle>
                    <CardDescription>
                      Requested by {approval.RequestedByName} • Level {approval.Level}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(approval.Priority)}>
                      {approval.Priority}
                    </Badge>
                    {approval.DueDate && (
                      <Badge variant="outline" className="text-orange-600">
                        <Calendar className="h-3 w-3 mr-1" />
                        Due {new Date(approval.DueDate).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Forwarded From</Label>
                    <p className="text-sm text-gray-600">{approval.ForwardedFromName}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Forward Reason</Label>
                    <p className="text-sm text-gray-600">{approval.ForwardReason}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      Forwarded on {new Date(approval.ForwardDate).toLocaleString()}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(approval)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedApproval(approval);
                          setShowForwardDialog(true);
                        }}
                      >
                        <Forward className="h-4 w-4 mr-1" />
                        Forward
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedApproval(approval);
                          setShowApproveDialog(true);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedApproval(approval);
                          setShowRejectDialog(true);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approval History Dialog */}
      {selectedApproval && (
        <Dialog open={!!selectedApproval && !showForwardDialog && !showApproveDialog && !showRejectDialog} onOpenChange={() => setSelectedApproval(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Approval Details - {selectedApproval.IssuanceNumber}</DialogTitle>
              <DialogDescription>
                Complete approval history and current status
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Requested By</Label>
                  <p className="text-sm">{selectedApproval.RequestedByName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Current Level</Label>
                  <p className="text-sm">Level {selectedApproval.Level}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Approval History</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {approvalHistory.map((action, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      {getActionIcon(action.ActionType)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{action.ActionType}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(action.ActionDate).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          By {action.UserName} • Level {action.Level}
                        </p>
                        {action.Comments && (
                          <p className="text-sm mt-2 p-2 bg-white rounded border">
                            {action.Comments}
                          </p>
                        )}
                        {action.ForwardedToName && (
                          <p className="text-sm text-blue-600 mt-1">
                            → Forwarded to {action.ForwardedToName}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Forward Dialog */}
      <Dialog open={showForwardDialog} onOpenChange={setShowForwardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forward Approval</DialogTitle>
            <DialogDescription>
              Forward this approval to another user for action
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="forwardTo">Forward To</Label>
              <Select value={forwardToUserId} onValueChange={setForwardToUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user to forward to" />
                </SelectTrigger>
                <SelectContent>
                  {users.filter(u => u.Id !== user?.Id).map((u) => (
                    <SelectItem key={u.Id} value={u.Id}>
                      {u.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="forwardReason">Reason for Forwarding</Label>
              <Textarea
                id="forwardReason"
                value={forwardReason}
                onChange={(e) => setForwardReason(e.target.value)}
                placeholder="Explain why you're forwarding this approval..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForwardDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleForward} disabled={submitting}>
              {submitting ? 'Forwarding...' : 'Forward'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Request</DialogTitle>
            <DialogDescription>
              Approve this stock issuance request
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="comments">Comments (Optional)</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add any comments about your approval..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isFinalApproval"
                checked={isFinalApproval}
                onChange={(e) => setIsFinalApproval(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isFinalApproval" className="text-sm">
                This is the final approval (complete the process)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={submitting}>
              {submitting ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Reject this stock issuance request
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-sm text-red-800">
                This action will reject the request and stop the approval process.
              </span>
            </div>

            <div>
              <Label htmlFor="rejectComments">Reason for Rejection *</Label>
              <Textarea
                id="rejectComments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Please provide a clear reason for rejection..."
                rows={3}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject} 
              disabled={submitting || !comments}
            >
              {submitting ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovalManager;
