# Testing Guide: Enhanced Approval Forwarding System

## 🎯 Real User Testing Setup

The system now uses **REAL USERS** from your existing AspNetUsers table instead of test users. Here's how to test the approval forwarding system:

## 🔑 Test User Credentials

Based on your existing data, here are the real users available for testing:

### User 1: Kanwar Shujat Ali (DEC1 Role)
- **Username/Login**: `4130423170445` (CNIC)
- **Full Name**: Kanwar Shujat Ali
- **Role**: DEC1
- **Has Pending Approvals**: ISS-TEST-001 (High Priority), ISS-TEST-002 (Urgent Priority)

### User 2: Nadeem-ur-Rehman (DEC1 Role)  
- **Username/Login**: `5440005340249` (CNIC)
- **Full Name**: Nadeem-ur-Rehman
- **Role**: DEC1
- **Has Pending Approvals**: ISS-TEST-002 (forwarded from Kanwar)

### User 3: Muhammad Abubakar Ali Zafar (LMS Role)
- **Username/Login**: `3840311380871` (CNIC)
- **Full Name**: Muhammad Abubakar Ali Zafar
- **Role**: LMS
- **Has Pending Approvals**: ISS-TEST-001 (forwarded from Kanwar)

### User 4: 33106-1081014-9 (LMS Role)
- **Username/Login**: `3310610810149` (CNIC)
- **Full Name**: 33106-1081014-9
- **Role**: LMS
- **Has Pending Approvals**: ISS-TEST-003 (forwarded from Muhammad Abubakar)

### User 5: Aaber Farooq (DEC1 Role)
- **Username/Login**: `3330148176373` (CNIC)
- **Full Name**: Aaber Farooq
- **Role**: DEC1
- **No Pending Approvals**: Available for forwarding to

## 🧪 Testing Scenarios

### Scenario 1: Login and View Pending Approvals
1. **Go to**: http://localhost:8082/
2. **Login with**: `3840311380871` (Muhammad Abubakar Ali Zafar)
3. **Navigate to**: "Approval Manager" from dashboard
4. **Expected**: See ISS-TEST-001 pending approval (High Priority)

### Scenario 2: Forward an Approval
1. **Login as**: `3840311380871` (Muhammad Abubakar)
2. **Go to**: Approval Manager
3. **Click**: "Forward" on ISS-TEST-001
4. **Select**: `3330148176373` (Aaber Farooq) from dropdown
5. **Add Reason**: "Please review this high-priority request"
6. **Set Priority**: High
7. **Click**: Forward
8. **Expected**: Approval forwarded successfully

### Scenario 3: Approve a Request
1. **Login as**: `5440005340249` (Nadeem-ur-Rehman)
2. **Go to**: Approval Manager
3. **View**: ISS-TEST-002 (Urgent Priority)
4. **Click**: "Approve"
5. **Add Comments**: "Approved after review"
6. **Check**: "This is the final approval" (if appropriate)
7. **Click**: Approve
8. **Expected**: Request approved successfully

### Scenario 4: Reject a Request
1. **Login as**: `3310610810149` (33106-1081014-9)
2. **Go to**: Approval Manager
3. **View**: ISS-TEST-003
4. **Click**: "Reject"
5. **Add Reason**: "Insufficient documentation provided"
6. **Click**: Reject
7. **Expected**: Request rejected with reason logged

### Scenario 5: View Approval History
1. **Login with any user**
2. **Go to**: Approval Manager
3. **Click**: "View Details" on any issuance
4. **Expected**: See complete approval timeline with all actions

## 🔍 Verification Steps

### Database Verification
```sql
-- Check current approval status
SELECT * FROM View_IssuanceApprovalStatus 
WHERE IssuanceNumber LIKE 'ISS-TEST-%';

-- Check approval history
SELECT 
    IssuanceId, ActionType, ActionDate, 
    u.FullName as ActionBy, Comments
FROM IssuanceApprovalHistory ah
INNER JOIN AspNetUsers u ON ah.UserId = u.Id
WHERE IssuanceId IN (
    SELECT Id FROM StockIssuances 
    WHERE IssuanceNumber LIKE 'ISS-TEST-%'
)
ORDER BY ActionDate DESC;

-- Check active forwards
SELECT 
    si.IssuanceNumber,
    uf.FullName as ForwardedFrom,
    ut.FullName as ForwardedTo,
    af.ForwardReason,
    af.Priority
FROM IssuanceApprovalForwards af
INNER JOIN StockIssuances si ON af.IssuanceId = si.Id
INNER JOIN AspNetUsers uf ON af.ForwardedFromUserId = uf.Id
INNER JOIN AspNetUsers ut ON af.ForwardedToUserId = ut.Id
WHERE af.IsActive = 1;
```

## 🎯 Key Features to Test

### ✅ Authentication with Real Users
- Users can login with their CNIC as username
- Proper password hash verification using bcrypt
- Session management with role-based access

### ✅ Flexible Approval Forwarding
- Forward to ANY user from AspNetUsers table
- Add forwarding reasons and set priorities
- Set due dates for urgent items

### ✅ Complete Approval Workflow
- Approve with optional final approval flag
- Reject with mandatory reason
- Complete audit trail of all actions

### ✅ Priority and Due Date Management
- High/Urgent priority items have due dates
- Visual indicators for priority levels
- Overdue item tracking

## 🚀 System URLs
- **Frontend**: http://localhost:8082/
- **Backend**: http://localhost:3001/
- **Login**: Use CNIC as username with existing password

## 📊 Expected Test Results

After testing, you should see:
1. **Real user authentication** working with existing PasswordHash
2. **Pending approvals** displayed for appropriate users
3. **Successful forwarding** to any selected user
4. **Complete approval history** with timestamps and comments
5. **Status updates** reflected in real-time
6. **Database consistency** with all transactions properly recorded

## ✨ Key Benefits Achieved

1. **Uses Existing Users**: No more test users, leverages your real AspNetUsers data
2. **Proper Authentication**: Uses bcrypt with PasswordHash for security
3. **Flexible Forwarding**: Can forward to any user in the system
4. **Complete Audit Trail**: Every action is logged with full details
5. **Role-Based Access**: Different users see different approval levels

---

**The system is now ready for production use with your existing user base!**
