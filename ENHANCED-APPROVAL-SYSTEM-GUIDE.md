# Enhanced Approval System with Inventory Control

## Overview
The approval system has been enhanced to provide better inventory management and handle custom items through the tender process.

## Key Features

### 1. Inventory Quantity Checking
- **Real-time Stock Display**: Shows current inventory quantities during approval
- **Stock Status Indicators**:
  - ✅ **Sufficient**: Green badge - enough stock available
  - ⚠️ **Insufficient**: Yellow badge - partial stock available
  - ❌ **Out of Stock**: Red badge - no stock available
  - ❓ **Unknown**: Gray badge - stock information unavailable

### 2. Authority Control
- **Approve with Stock Awareness**: You can see exactly how much inventory is available before approving
- **Quantity Adjustment**: Can approve partial quantities based on actual stock levels
- **Stock-based Decisions**: System warns about insufficient stock and lets you decide whether to proceed

### 3. Custom Items Handling
- **Automatic Tender Routing**: Custom items are automatically routed to tender process
- **No Manual Approval Needed**: Custom items don't require inventory approval
- **Clear Separation**: Custom items are visually separated from inventory items
- **Policy Notification**: Clear indication that custom items follow procurement workflow

## How It Works

### For Inventory Items:
1. **Stock Check**: System automatically fetches current stock levels
2. **Visual Indicators**: Color-coded badges show stock status
3. **Quantity Control**: You can adjust approved quantities based on available stock
4. **Warning System**: Alerts you when requested quantity exceeds available stock
5. **Authority Decision**: You can choose to approve anyway or reject for restocking

### For Custom Items:
1. **Automatic Detection**: System identifies custom items
2. **Tender Routing**: Custom items are sent to tender process
3. **Status Update**: Items marked as "Referred to Tender"
4. **No Stock Check**: Custom items bypass inventory checking

## Approval Workflow

### Mixed Requests (Inventory + Custom Items):
1. **Inventory Items**: Approved/rejected based on your decision and stock availability
2. **Custom Items**: Automatically routed to tender process
3. **Request Status**: 
   - "Partially Approved" if some items approved, custom items to tender
   - "Referred to Tender" if all items were custom
   - "Approved" if only inventory items and all approved

### Stock Warnings:
- **Insufficient Stock**: System shows warning but allows approval with confirmation
- **Out of Stock**: Clear indication that item cannot be fulfilled immediately
- **Maximum Quantity**: Input fields limited to available stock levels

## Benefits

### For Approvers:
- **Informed Decisions**: See actual stock levels before approving
- **Flexible Control**: Can approve partial quantities or reject for restocking
- **Reduced Errors**: No more approving items that aren't in stock
- **Clear Process**: Custom items handled automatically through proper channels

### For System Efficiency:
- **Better Inventory Management**: Prevents over-allocation of stock
- **Proper Procurement Flow**: Custom items follow appropriate tender process
- **Audit Trail**: Clear record of approval decisions and stock considerations
- **Reduced Manual Work**: Automated routing of custom items

## Usage Examples

### Scenario 1: Sufficient Stock
- Request: 10 units of Item A
- Current Stock: 25 units
- Action: ✅ Approve full quantity (or adjust if needed)

### Scenario 2: Insufficient Stock
- Request: 20 units of Item B
- Current Stock: 8 units
- Action: ⚠️ Can approve 8 units or reject for restocking

### Scenario 3: Mixed Request
- Request: 5 inventory items + 2 custom items
- Action: Approve inventory items based on stock, custom items auto-routed to tender

### Scenario 4: Custom Items Only
- Request: 3 custom items
- Action: All items automatically sent to tender process, no manual approval needed

## Authority Features

### Stock-Based Decision Making:
- See current stock levels for each requested item
- Understand impact on inventory before approving
- Make informed decisions about partial approvals

### Flexible Approval Options:
- Approve full requested quantity (if stock available)
- Approve partial quantity (based on available stock)
- Reject for restocking or procurement
- Add comments explaining your decision

### Custom Item Management:
- No need to manually handle custom items
- Automatic routing to appropriate procurement channels
- Clear separation from inventory-based approvals

This enhanced system ensures better inventory control while streamlining the approval process for both standard inventory items and custom procurement needs.
