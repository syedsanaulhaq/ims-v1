# Enhanced Stock Issuance Approval Workflow

## Problem Statement
Current approval system assumes all requested items exist in inventory, but custom item names don't guarantee stock availability. Approvers need to see actual inventory and make informed decisions.

## Enhanced Workflow Design

### 1. Request Submission (Unchanged)
- Requester submits items (custom names or from master list)
- System creates stock_issuance_requests and stock_issuance_items

### 2. Enhanced Approval Interface

#### A. Request Overview (Non-editable)
```
Original Request: REQ-2025-001
Requester: John Doe (Admin Department)
Purpose: Office Setup
Urgency: High

REQUESTED ITEMS (As submitted by requester):
1. "Dell Laptop Inspiron 15" - Qty: 2
2. "Office Chair Ergonomic" - Qty: 3
3. "Printer HP LaserJet" - Qty: 1
```

#### B. Stock Availability Analysis (For each requested item)
```
REQUEST ITEM #1: "Dell Laptop Inspiron 15" (Qty: 2)

AVAILABLE INVENTORY MATCHES:
┌─────────────────────────────────────────────────────────────┐
│ ✅ Dell Inspiron 15 3000 (Stock: 5 units)                   │
│    ○ Available: 5  ○ Reserved: 0  ○ Can Issue: 5           │
│    Select quantity: [2] [Use This Item]                     │
├─────────────────────────────────────────────────────────────┤
│ ✅ Dell Inspiron 15 5000 (Stock: 3 units)                   │
│    ○ Available: 3  ○ Reserved: 1  ○ Can Issue: 2           │
│    Select quantity: [0] [Use This Item]                     │
└─────────────────────────────────────────────────────────────┘

DECISION OPTIONS:
[ ] Fulfill from stock (select items above)
[ ] Partial fulfillment (use available + procure remainder)
[ ] Request procurement (add to tender list)
[ ] Reject (provide reason)
```

#### C. Approval Actions
```
For each requested item, approver can:
1. APPROVE WITH STOCK ALLOCATION
   - Select specific inventory items
   - Specify quantities from available stock
   - Items get reserved pending issuance

2. APPROVE WITH PROCUREMENT
   - Mark as "Procurement Required"
   - Add to procurement pipeline
   - Set expected timeline

3. PARTIAL APPROVAL
   - Issue available quantity immediately
   - Queue remainder for procurement

4. REJECT
   - Provide rejection reason
   - Suggest alternatives if available
```

### 3. Database Schema Updates

#### New Tables Needed:

```sql
-- Track approval decisions for each requested item
CREATE TABLE stock_issuance_approval_decisions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    request_id UNIQUEIDENTIFIER NOT NULL,
    requested_item_id UNIQUEIDENTIFIER NOT NULL,
    decision_type NVARCHAR(50) NOT NULL, -- 'APPROVE_FROM_STOCK', 'APPROVE_FOR_PROCUREMENT', 'PARTIAL', 'REJECT'
    inventory_item_id UNIQUEIDENTIFIER NULL, -- If fulfilled from stock
    approved_quantity INT NULL,
    procurement_required_quantity INT NULL,
    rejection_reason NVARCHAR(500) NULL,
    approver_id NVARCHAR(450) NOT NULL,
    approved_at DATETIME2 DEFAULT GETDATE(),
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (request_id) REFERENCES stock_issuance_requests(id),
    FOREIGN KEY (requested_item_id) REFERENCES stock_issuance_items(id)
);

-- Track procurement requests generated from approvals
CREATE TABLE procurement_requests (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    original_request_id UNIQUEIDENTIFIER NOT NULL,
    requested_item_id UNIQUEIDENTIFIER NOT NULL,
    item_description NVARCHAR(500) NOT NULL,
    required_quantity INT NOT NULL,
    estimated_unit_price DECIMAL(10,2) NULL,
    urgency_level NVARCHAR(50) NOT NULL,
    target_delivery_date DATE NULL,
    procurement_status NVARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'TENDER_CREATED', 'ORDERED', 'DELIVERED'
    tender_id UNIQUEIDENTIFIER NULL,
    created_by NVARCHAR(450) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (original_request_id) REFERENCES stock_issuance_requests(id),
    FOREIGN KEY (requested_item_id) REFERENCES stock_issuance_items(id)
);

-- Track stock reservations during approval process
CREATE TABLE stock_reservations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    inventory_item_id UNIQUEIDENTIFIER NOT NULL,
    request_id UNIQUEIDENTIFIER NOT NULL,
    requested_item_id UNIQUEIDENTIFIER NOT NULL,
    reserved_quantity INT NOT NULL,
    reservation_status NVARCHAR(50) DEFAULT 'ACTIVE', -- 'ACTIVE', 'ISSUED', 'CANCELLED'
    reserved_by NVARCHAR(450) NOT NULL,
    reserved_at DATETIME2 DEFAULT GETDATE(),
    expires_at DATETIME2 NOT NULL, -- Auto-cancel after X days
    issued_at DATETIME2 NULL,
    cancelled_at DATETIME2 NULL,
    FOREIGN KEY (request_id) REFERENCES stock_issuance_requests(id),
    FOREIGN KEY (requested_item_id) REFERENCES stock_issuance_items(id)
);
```

### 4. API Endpoints Updates

#### New Endpoints:
```
GET /api/stock-issuance/requests/:id/inventory-matches
- Find inventory items matching requested item names
- Return available quantities and specifications

POST /api/stock-issuance/requests/:id/approve-with-allocation
- Approve request with specific inventory item allocations
- Create stock reservations
- Update request status

POST /api/stock-issuance/requests/:id/approve-with-procurement
- Approve request but mark items for procurement
- Create procurement requests
- Update request status

GET /api/procurement/requests
- List all procurement requests
- Filter by status, urgency, etc.

POST /api/procurement/create-tender
- Convert procurement requests to tender
- Group similar items
```

### 5. Frontend Components

#### Enhanced Approval Interface:
1. **Request Summary Card** (read-only)
2. **Item-by-Item Approval Grid**
   - Original request details
   - Available inventory matches
   - Quantity selectors
   - Decision radio buttons
3. **Approval Summary Panel**
   - Items to be issued immediately
   - Items requiring procurement
   - Total cost estimate
4. **Action Buttons**
   - Approve Selected Allocations
   - Request Procurement for Remaining
   - Reject Entire Request

### 6. Business Logic Flow

```
1. Requester submits request with custom item names
2. System stores original request as-is
3. Approver opens request for review
4. System automatically searches inventory for matching items
5. Approver sees:
   - Original request (unchanged)
   - Available inventory options
   - Stock levels and availability
6. Approver makes decisions:
   - Option A: Select inventory items to fulfill request
   - Option B: Request procurement for unavailable items
   - Option C: Reject with reasons
7. System creates:
   - Stock reservations (for immediate fulfillment)
   - Procurement requests (for items to be purchased)
   - Approval audit trail
8. Approved items get reserved in inventory
9. Procurement requests go to purchasing department
```

### 7. Benefits of This Approach

✅ **Separation of Concerns**: Request vs. Inventory vs. Procurement
✅ **Stock Visibility**: Approvers see real inventory levels
✅ **Audit Trail**: Complete history of approval decisions
✅ **Procurement Integration**: Seamless flow to purchasing
✅ **Partial Fulfillment**: Handle mixed scenarios gracefully
✅ **Reservation System**: Prevent double-allocation of stock
✅ **Business Intelligence**: Track procurement patterns

### 8. Implementation Priority

**Phase 1**: Enhanced approval interface with inventory matching
**Phase 2**: Stock reservation system  
**Phase 3**: Procurement request generation
**Phase 4**: Tender integration and automation

This approach treats the approval process as what it really is: a business decision about resource allocation, not just a yes/no on arbitrary item names.
