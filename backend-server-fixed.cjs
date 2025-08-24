const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '.env.sqlserver' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads', 'tender-files');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept common document and image formats
    const allowedTypes = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|jpg|jpeg|png|gif)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only documents and images are allowed.'));
    }
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// SQL Server configuration - Using exact server name from SSMS
const sqlConfig = {
  server: 'SYED-FAZLI-LAPT', // Exact server name as used in SSMS
  database: 'InventoryManagementDB',
  user: 'inventoryuser',
  password: '1978Jupiter87@#',
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  requestTimeout: 30000,
  connectionTimeout: 30000
};
let pool;

// Default session for development/testing
const DEFAULT_SESSION = {
  user_id: 'DEV-USER-001',
  user_name: 'Development User',
  email: 'dev.user@system.com',
  role: 'Admin',
  office_id: 583,
  wing_id: 19,
  created_at: new Date().toISOString()
};

// Session management
const sessions = new Map();
const DEFAULT_SESSION_ID = 'default-session';

// Initialize default session
sessions.set(DEFAULT_SESSION_ID, DEFAULT_SESSION);

// Initialize SQL Server connection
async function initializeDatabase() {
  try {
    console.log('🔗 Connecting to SQL Server...');
    pool = await sql.connect(sqlConfig);
    console.log('✅ Connected to SQL Server successfully');
    
    // Test the connection
    const testResult = await pool.request().query('SELECT @@VERSION as version');
    console.log('📊 Database version:', testResult.recordset[0]?.version?.substring(0, 50) + '...');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('⚠️  Server will continue with mock data fallback');
    // Don't exit - allow server to run with mock data
  }
}

// API Routes

// Session management endpoints
app.get('/api/session', (req, res) => {
  // For now, always return the default session
  res.json({
    success: true,
    session: DEFAULT_SESSION,
    session_id: DEFAULT_SESSION_ID
  });
});

app.get('/api/session/current-user', (req, res) => {
  // Return current user info
  res.json({
    success: true,
    user: DEFAULT_SESSION
  });
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return the relative path that can be used to access the file
    const filePath = `tender-files/${req.file.filename}`;
    res.json({ 
      success: true,
      filePath: filePath,
      originalName: req.file.originalname,
      size: req.file.size,
      url: `http://localhost:3001/uploads/${filePath}`
    });
  } catch (error) {
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Get all active offices
app.get('/api/offices', async (req, res) => {
  try {
    if (!pool) {
      // Return mock data when SQL Server is not connected
      const mockOffices = [
        { intOfficeID: 1, strOfficeName: 'Head Office', strOfficeDescription: 'Main headquarters', strTelephoneNumber: '021-1234567', strEmail: 'head@company.com', OfficeCode: 'HO001' },
        { intOfficeID: 2, strOfficeName: 'Branch Office Karachi', strOfficeDescription: 'Karachi branch', strTelephoneNumber: '021-7654321', strEmail: 'karachi@company.com', OfficeCode: 'KHI001' },
        { intOfficeID: 3, strOfficeName: 'Branch Office Lahore', strOfficeDescription: 'Lahore branch', strTelephoneNumber: '042-1234567', strEmail: 'lahore@company.com', OfficeCode: 'LHR001' }
      ];
      return res.json(mockOffices);
    }

    const result = await pool.request().query(`
      SELECT 
        intOfficeID,
        strOfficeName,
        strOfficeDescription,
        strTelephoneNumber,
        strEmail,
        OfficeCode,
        IS_ACT,
        IS_DELETED,
        CreatedAt,
        UpdatedAt,
        CreatedBy,
        UpdatedBy,
        Version,
        CRT_BY,
        CRT_AT,
        LST_MOD_BY,
        LST_MOD_AT,
        DEL_BY,
        DEL_AT,
        DEL_IP,
        strFax,
        strGPSCoords,
        strPhotoPath,
        intProvinceID,
        intDivisionID,
        intDistrictID,
        intConstituencyID
      FROM tblOffices 
      WHERE IS_ACT = 1 AND (IS_DELETED = 0 OR IS_DELETED IS NULL)
      ORDER BY strOfficeName
    `);
    res.json(result.recordset);
  } catch (error) {
    // Fallback to mock data on any error
    const mockOffices = [
      { intOfficeID: 1, strOfficeName: 'Head Office', strOfficeDescription: 'Main headquarters', strTelephoneNumber: '021-1234567', strEmail: 'head@company.com', OfficeCode: 'HO001' },
      { intOfficeID: 2, strOfficeName: 'Branch Office Karachi', strOfficeDescription: 'Karachi branch', strTelephoneNumber: '021-7654321', strEmail: 'karachi@company.com', OfficeCode: 'KHI001' },
      { intOfficeID: 3, strOfficeName: 'Branch Office Lahore', strOfficeDescription: 'Lahore branch', strTelephoneNumber: '042-1234567', strEmail: 'lahore@company.com', OfficeCode: 'LHR001' }
    ];
    res.json(mockOffices);
  }
});

// Get all active wings
app.get('/api/wings', async (req, res) => {
  try {
    if (!pool) {
      // Return mock data when SQL Server is not connected
      const mockWings = [
        { Id: 1, Name: 'Administration Wing', ShortName: 'Admin', FocalPerson: 'John Smith', ContactNo: '021-1111111', WingCode: 'ADM001' },
        { Id: 2, Name: 'Finance Wing', ShortName: 'Finance', FocalPerson: 'Jane Doe', ContactNo: '021-2222222', WingCode: 'FIN001' },
        { Id: 3, Name: 'Operations Wing', ShortName: 'Operations', FocalPerson: 'Mike Johnson', ContactNo: '021-3333333', WingCode: 'OPS001' }
      ];
      return res.json(mockWings);
    }

    const result = await pool.request().query(`
      SELECT 
        Id,
        Name,
        ShortName,
        FocalPerson,
        ContactNo,
        Creator,
        CreateDate,
        Modifier,
        ModifyDate,
        OfficeID,
        IS_ACT,
        HODID,
        HODName,
        WingCode,
        CreatedAt,
        UpdatedAt
      FROM WingsInformation 
      WHERE IS_ACT = 1
      ORDER BY Name
    `);
    res.json(result.recordset);
  } catch (error) {
    // Fallback to mock data on any error
    const mockWings = [
      { Id: 1, Name: 'Administration Wing', ShortName: 'Admin', FocalPerson: 'John Smith', ContactNo: '021-1111111', WingCode: 'ADM001' },
      { Id: 2, Name: 'Finance Wing', ShortName: 'Finance', FocalPerson: 'Jane Doe', ContactNo: '021-2222222', WingCode: 'FIN001' },
      { Id: 3, Name: 'Operations Wing', ShortName: 'Operations', FocalPerson: 'Mike Johnson', ContactNo: '021-3333333', WingCode: 'OPS001' }
    ];
    res.json(mockWings);
  }
});

// Get all active DECs
app.get('/api/decs', async (req, res) => {
  try {
    if (!pool) {
      // Return mock data when SQL Server is not connected
      const mockDecs = [
        { intAutoID: 1, WingID: 1, DECName: 'Human Resources DEC', DECAcronym: 'HR', DECAddress: 'Block A, Office Complex', Location: 'Islamabad', DECCode: 'HR001' },
        { intAutoID: 2, WingID: 2, DECName: 'Information Technology DEC', DECAcronym: 'IT', DECAddress: 'Block B, Office Complex', Location: 'Karachi', DECCode: 'IT001' },
        { intAutoID: 3, WingID: 3, DECName: 'Procurement DEC', DECAcronym: 'PROC', DECAddress: 'Block C, Office Complex', Location: 'Lahore', DECCode: 'PROC001' }
      ];
      return res.json(mockDecs);
    }

    const result = await pool.request().query(`
      SELECT 
        intAutoID,
        WingID,
        DECName,
        DECAcronym,
        DECAddress,
        Location,
        IS_ACT,
        DateAdded,
        DECCode,
        HODID,
        HODName,
        CreatedAt,
        UpdatedAt,
        CreatedBy,
        UpdatedBy,
        Version
      FROM DEC_MST 
      WHERE IS_ACT = 1
      ORDER BY DECName
    `);
    res.json(result.recordset);
  } catch (error) {
    // Fallback to mock data on any error
    const mockDecs = [
      { intAutoID: 1, WingID: 1, DECName: 'Human Resources DEC', DECAcronym: 'HR', DECAddress: 'Block A, Office Complex', Location: 'Islamabad', DECCode: 'HR001' },
      { intAutoID: 2, WingID: 2, DECName: 'Information Technology DEC', DECAcronym: 'IT', DECAddress: 'Block B, Office Complex', Location: 'Karachi', DECCode: 'IT001' },
      { intAutoID: 3, WingID: 3, DECName: 'Procurement DEC', DECAcronym: 'PROC', DECAddress: 'Block C, Office Complex', Location: 'Lahore', DECCode: 'PROC001' }
    ];
    res.json(mockDecs);
  }
});

// Get all active users from AspNetUsers
app.get('/api/users', async (req, res) => {
  try {
    if (!pool) {
      // Return mock data when SQL Server is not connected
      const mockUsers = [
        { Id: '1', FullName: 'John Doe', UserName: 'john.doe', Email: 'john.doe@company.com', Role: 'Admin', intOfficeID: 583, intWingID: 16, ISACT: true },
        { Id: '2', FullName: 'Jane Smith', UserName: 'jane.smith', Email: 'jane.smith@company.com', Role: 'User', intOfficeID: 584, intWingID: 17, ISACT: true },
        { Id: '3', FullName: 'Mike Johnson', UserName: 'mike.johnson', Email: 'mike.johnson@company.com', Role: 'Manager', intOfficeID: 585, intWingID: 18, ISACT: true }
      ];
      return res.json(mockUsers);
    }

    const result = await pool.request().query(`
      SELECT 
        Id,
        FullName,
        FatherOrHusbandName,
        CNIC,
        UserName,
        Email,
        PhoneNumber,
        Role,
        intOfficeID,
        intWingID,
        intBranchID,
        intDesignationID,
        ISACT,
        AddedOn,
        LastLoggedIn,
        Gender,
        ProfilePhoto,
        UID
      FROM AspNetUsers 
      WHERE ISACT = 1
      ORDER BY FullName
    `);
    res.json(result.recordset);
  } catch (error) {
    // Fallback to mock data on any error
    const mockUsers = [
      { Id: '1', FullName: 'John Doe', UserName: 'john.doe', Email: 'john.doe@company.com', Role: 'Admin', intOfficeID: 583, intWingID: 16, ISACT: true },
      { Id: '2', FullName: 'Jane Smith', UserName: 'jane.smith', Email: 'jane.smith@company.com', Role: 'User', intOfficeID: 584, intWingID: 17, ISACT: true },
      { Id: '3', FullName: 'Mike Johnson', UserName: 'mike.johnson', Email: 'mike.johnson@company.com', Role: 'Manager', intOfficeID: 585, intWingID: 18, ISACT: true }
    ];
    res.json(mockUsers);
  }
});

// Get wings by office
app.get('/api/offices/:officeId/wings', async (req, res) => {
  try {
    const { officeId } = req.params;
    const result = await pool.request()
      .input('officeId', sql.Int, officeId)
      .query(`
        SELECT 
          Id,
          Name,
          ShortName,
          FocalPerson,
          ContactNo,
          Creator,
          CreateDate,
          Modifier,
          ModifyDate,
          OfficeID,
          IS_ACT,
          HODID,
          HODName,
          WingCode,
          CreatedAt,
          UpdatedAt
        FROM WingsInformation 
        WHERE OfficeID = @officeId AND IS_ACT = 1
        ORDER BY Name
      `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wings by office', details: error.message });
  }
});

// Get DECs by wing
app.get('/api/wings/:wingId/decs', async (req, res) => {
  try {
    const { wingId } = req.params;
    const result = await pool.request()
      .input('wingId', sql.Int, wingId)
      .query(`
        SELECT 
          intAutoID,
          WingID,
          DECName,
          DECAcronym,
          DECAddress,
          Location,
          IS_ACT,
          DateAdded,
          DECCode,
          HODID,
          HODName,
          CreatedAt,
          UpdatedAt,
          CreatedBy,
          UpdatedBy,
          Version
        FROM DEC_MST 
        WHERE WingID = @wingId AND IS_ACT = 1
        ORDER BY DECName
      `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch DECs by wing', details: error.message });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    if (pool) {
      const result = await pool.request().query('SELECT 1 as test');
      res.json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
    } else {
      res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
    }
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', database: 'error', error: error.message });
  }
});

// Check if inventoryuser exists
app.get('/api/check-user', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    // Check if inventoryuser exists
    const userCheck = await pool.request().query(`
      SELECT 
        name,
        type_desc,
        create_date,
        modify_date,
        is_disabled
      FROM sys.server_principals 
      WHERE name = 'inventoryuser'
    `);

    // Check database users
    const dbUserCheck = await pool.request().query(`
      SELECT 
        name,
        type_desc,
        create_date,
        modify_date
      FROM sys.database_principals 
      WHERE name = 'inventoryuser'
    `);

    // Check current user
    const currentUser = await pool.request().query('SELECT SYSTEM_USER as current_user, USER_NAME() as database_user');

    res.json({
      serverLogin: userCheck.recordset,
      databaseUser: dbUserCheck.recordset,
      currentConnection: currentUser.recordset[0],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to check user', details: error.message });
  }
});

// =============================================================================
// STOCK ISSUANCE API ENDPOINTS (REBUILT FROM SCRATCH)
// =============================================================================

// Submit stock issuance request
app.post('/api/stock-issuance/requests', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const {
      request_number,
      request_type,
      requester_office_id,
      requester_wing_id,
      requester_branch_id,
      requester_user_id,
      purpose,
      urgency_level,
      justification,
      expected_return_date,
      is_returnable,
      request_status = 'Submitted'
    } = req.body;
    // Insert stock issuance request
    const requestResult = await pool.request()
      .input('request_number', sql.NVarChar, request_number)
      .input('request_type', sql.NVarChar, request_type)
      .input('requester_office_id', sql.Int, requester_office_id)
      .input('requester_wing_id', sql.Int, requester_wing_id)
      .input('requester_branch_id', sql.NVarChar, requester_branch_id)
      .input('requester_user_id', sql.UniqueIdentifier, requester_user_id)
      .input('purpose', sql.NVarChar, purpose)
      .input('urgency_level', sql.NVarChar, urgency_level)
      .input('justification', sql.NVarChar, justification)
      .input('expected_return_date', sql.NVarChar, expected_return_date)
      .input('is_returnable', sql.Bit, is_returnable)
      .input('request_status', sql.NVarChar, request_status)
      .query(`
        INSERT INTO stock_issuance_requests (
          id, request_number, request_type, requester_office_id, requester_wing_id,
          requester_branch_id, requester_user_id, purpose, urgency_level, 
          justification, expected_return_date, is_returnable, request_status,
          submitted_at, created_at, updated_at
        ) 
        OUTPUT INSERTED.id, INSERTED.request_number
        VALUES (
          NEWID(), @request_number, @request_type, @requester_office_id, @requester_wing_id,
          @requester_branch_id, @requester_user_id, @purpose, @urgency_level,
          @justification, @expected_return_date, @is_returnable, @request_status,
          GETDATE(), GETDATE(), GETDATE()
        )
      `);
    res.json({
      success: true,
      data: requestResult.recordset[0]
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to create request', details: error.message });
  }
});

// Submit stock issuance items
app.post('/api/stock-issuance/items', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const { request_id, items } = req.body;
    // Insert multiple items
    const itemInserts = items.map(item => {
      return pool.request()
        .input('request_id', sql.UniqueIdentifier, request_id)
        .input('item_master_id', sql.UniqueIdentifier, item.item_master_id)
        .input('nomenclature', sql.NVarChar, item.nomenclature)
        .input('requested_quantity', sql.Int, item.requested_quantity)
        .input('unit_price', sql.Decimal(10,2), item.unit_price || 0)
        .input('item_type', sql.NVarChar, item.item_type)
        .input('custom_item_name', sql.NVarChar, item.custom_item_name)
        .query(`
          INSERT INTO stock_issuance_items (
            id, request_id, item_master_id, nomenclature, requested_quantity,
            unit_price, item_type, custom_item_name, created_at, updated_at
          ) VALUES (
            NEWID(), @request_id, @item_master_id, @nomenclature, @requested_quantity,
            @unit_price, @item_type, @custom_item_name, GETDATE(), GETDATE()
          )
        `);
    });

    await Promise.all(itemInserts);
    res.json({ 
      success: true, 
      items_count: items.length,
      message: `Successfully created ${items.length} items`
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to create items', details: error.message });
  }
});

// Get stock issuance requests with proper JOINs
app.get('/api/stock-issuance/requests', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const { status } = req.query;
    let whereClause = '';
    
    if (status) {
      whereClause = `WHERE sir.request_status = '${status}'`;
    }
    // Main query with proper field mappings
    const requestsQuery = `
      SELECT 
        sir.id,
        sir.request_number,
        sir.request_type,
        sir.requester_office_id,
        sir.requester_wing_id,
        sir.requester_branch_id,
        sir.requester_user_id,
        sir.purpose,
        sir.urgency_level,
        sir.justification,
        sir.expected_return_date,
        sir.is_returnable,
        sir.request_status,
        sir.submitted_at,
        sir.created_at,
        sir.updated_at,
        -- Office information
        COALESCE(o.strOfficeName, 'Unknown Office') as office_name,
        COALESCE(o.OfficeCode, 'N/A') as office_code,
        -- Wing information  
        COALESCE(w.Name, 'Unknown Wing') as wing_name,
        COALESCE(w.ShortName, 'N/A') as wing_short_name,
        COALESCE(w.WingCode, 'N/A') as wing_code,
        -- User information
        COALESCE(u.FullName, 'Unknown User') as requester_full_name,
        COALESCE(u.Role, 'User') as requester_role,
        COALESCE(u.Email, 'N/A') as requester_email,
        COALESCE(u.UserName, 'N/A') as requester_username
      FROM stock_issuance_requests sir
      LEFT JOIN tblOffices o ON sir.requester_office_id = o.intOfficeID
      LEFT JOIN WingsInformation w ON sir.requester_wing_id = w.Id  
      LEFT JOIN AspNetUsers u ON CAST(sir.requester_user_id AS NVARCHAR(450)) = CAST(u.Id AS NVARCHAR(450))
      ${whereClause}
      ORDER BY sir.created_at DESC
    `;

    const result = await pool.request().query(requestsQuery);
    // Get items for each request
    const requestsWithItems = await Promise.all(
      result.recordset.map(async (request) => {
        try {
          const itemsResult = await pool.request()
            .input('request_id', sql.UniqueIdentifier, request.id)
            .query(`
              SELECT 
                sii.id,
                sii.item_master_id,
                sii.nomenclature,
                sii.requested_quantity,
                sii.unit_price,
                sii.item_type,
                sii.custom_item_name,
                sii.item_status,
                sii.created_at,
                sii.updated_at
              FROM stock_issuance_items sii
              WHERE sii.request_id = @request_id
              ORDER BY sii.created_at
            `);
          
          return {
            // Request data
            id: request.id,
            request_number: request.request_number,
            request_type: request.request_type,
            purpose: request.purpose,
            urgency_level: request.urgency_level,
            justification: request.justification,
            expected_return_date: request.expected_return_date,
            is_returnable: request.is_returnable,
            request_status: request.request_status,
            submitted_at: request.submitted_at,
            created_at: request.created_at,
            updated_at: request.updated_at,
            
            // Requester information
            requester: {
              user_id: request.requester_user_id,
              full_name: request.requester_full_name,
              role: request.requester_role,
              email: request.requester_email,
              username: request.requester_username
            },
            
            // Office information
            office: {
              office_id: request.requester_office_id,
              name: request.office_name,
              office_code: request.office_code
            },
            
            // Wing information
            wing: {
              wing_id: request.requester_wing_id,
              name: request.wing_name,
              short_name: request.wing_short_name,
              wing_code: request.wing_code
            },
            
            // Branch/DEC information (derived from wing)
            branch: {
              branch_id: request.requester_branch_id,
              dec_name: request.wing_name
            },
            
            // Items
            items: itemsResult.recordset || []
          };
        } catch (error) {
          return {
            ...request,
            requester: {
              user_id: request.requester_user_id,
              full_name: 'Unknown User',
              role: 'User',
              email: 'N/A',
              username: 'N/A'
            },
            office: {
              office_id: request.requester_office_id,
              name: 'Unknown Office',
              office_code: 'N/A'
            },
            wing: {
              wing_id: request.requester_wing_id,
              name: 'Unknown Wing',
              short_name: 'N/A',
              wing_code: 'N/A'
            },
            branch: {
              branch_id: request.requester_branch_id,
              dec_name: 'Unknown Wing'
            },
            items: []
          };
        }
      })
    );

    // Calculate dashboard counts
    const totalCount = requestsWithItems.length;
    const pendingCount = requestsWithItems.filter(r => 
      r.request_status === 'Submitted' || r.request_status === 'Pending'
    ).length;
    const approvedCount = requestsWithItems.filter(r => 
      r.request_status === 'Approved'
    ).length;
    const issuedCount = requestsWithItems.filter(r => 
      r.request_status === 'Issued'
    ).length;
    if (requestsWithItems.length > 0) {
    }
    
    res.json({
      success: true,
      data: requestsWithItems,
      summary: {
        totalCount,
        pendingCount,
        approvedCount,
        issuedCount
      },
      pagination: {
        totalPages: 1,
        currentPage: 1,
        pageSize: requestsWithItems.length
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch requests', 
      details: error.message 
    });
  }
});

// Get issued items for stock returns (returnable items with status 'Issued')
app.get('/api/stock-issuance/issued-items', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const result = await pool.request().query(`
      SELECT 
        sii.id,
        sii.request_id,
        sii.nomenclature,
        sii.requested_quantity,
        sir.request_number,
        sir.created_at,
        sir.expected_return_date,
        sir.is_returnable,
        u.FullName as requester_name
      FROM stock_issuance_items sii
      INNER JOIN stock_issuance_requests sir ON sii.request_id = sir.id
      LEFT JOIN AspNetUsers u ON CAST(sir.requester_user_id AS NVARCHAR(450)) = CAST(u.Id AS NVARCHAR(450))
      WHERE sir.is_returnable = 1 
        AND sii.item_status = 'Issued'
      ORDER BY sir.expected_return_date ASC
    `);
    res.json({
      success: true,
      data: result.recordset
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch issued items', details: error.message });
  }
});

// =============================================================================
// STOCK ISSUANCE APPROVAL ENDPOINTS
// =============================================================================

// Approve stock issuance request
app.put('/api/stock-issuance/requests/:id/approve', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const { id } = req.params;
    const {
      approver_name,
      approver_designation,
      approval_comments,
      item_approvals
    } = req.body;
    const transaction = pool.transaction();
    await transaction.begin();

    try {
      // Update request status to approved
      await transaction.request()
        .input('id', sql.UniqueIdentifier, id)
        .input('approver_name', sql.NVarChar, approver_name)
        .input('approver_designation', sql.NVarChar, approver_designation)
        .input('approval_comments', sql.NVarChar, approval_comments)
        .query(`
          UPDATE stock_issuance_requests 
          SET 
            request_status = 'Approved',
            approved_at = GETDATE(),
            approved_by = @approver_name,
            review_comments = @approval_comments,
            updated_at = GETDATE()
          WHERE id = @id
        `);

      // Update individual items if item_approvals provided
      if (item_approvals && Array.isArray(item_approvals)) {
        for (const itemApproval of item_approvals) {
          await transaction.request()
            .input('item_id', sql.UniqueIdentifier, itemApproval.item_id)
            .input('approved_quantity', sql.Int, itemApproval.approved_quantity)
            .input('rejection_reason', sql.NVarChar, itemApproval.rejection_reason || null)
            .query(`
              UPDATE stock_issuance_items 
              SET 
                approved_quantity = @approved_quantity,
                item_status = CASE 
                  WHEN @approved_quantity > 0 THEN 'Approved'
                  ELSE 'Rejected'
                END,
                rejection_reason = @rejection_reason,
                updated_at = GETDATE()
              WHERE id = @item_id
            `);
        }
      } else {
        // If no specific item approvals, approve all items with requested quantities
        await transaction.request()
          .input('request_id', sql.UniqueIdentifier, id)
          .query(`
            UPDATE stock_issuance_items 
            SET 
              approved_quantity = requested_quantity,
              item_status = 'Approved',
              updated_at = GETDATE()
            WHERE request_id = @request_id
          `);
      }

      await transaction.commit();
      res.json({
        success: true,
        message: 'Request approved successfully'
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    res.status(500).json({ error: 'Failed to approve request', details: error.message });
  }
});

// Reject stock issuance request
app.put('/api/stock-issuance/requests/:id/reject', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const { id } = req.params;
    const {
      approver_name,
      approver_designation,
      approval_comments
    } = req.body;
    const transaction = pool.transaction();
    await transaction.begin();

    try {
      // Update request status to rejected
      await transaction.request()
        .input('id', sql.UniqueIdentifier, id)
        .input('approver_name', sql.NVarChar, approver_name)
        .input('approver_designation', sql.NVarChar, approver_designation)
        .input('approval_comments', sql.NVarChar, approval_comments)
        .query(`
          UPDATE stock_issuance_requests 
          SET 
            request_status = 'Rejected',
            reviewed_at = GETDATE(),
            reviewed_by = @approver_name,
            review_comments = @approval_comments,
            updated_at = GETDATE()
          WHERE id = @id
        `);

      // Mark all items as rejected
      await transaction.request()
        .input('request_id', sql.UniqueIdentifier, id)
        .input('rejection_reason', sql.NVarChar, approval_comments || 'Request rejected by approver')
        .query(`
          UPDATE stock_issuance_items 
          SET 
            approved_quantity = 0,
            item_status = 'Rejected',
            rejection_reason = @rejection_reason,
            updated_at = GETDATE()
          WHERE request_id = @request_id
        `);

      await transaction.commit();
      res.json({
        success: true,
        message: 'Request rejected successfully'
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    res.status(500).json({ error: 'Failed to reject request', details: error.message });
  }
});

// Get pending requests for approval (alias for submitted status)
app.get('/api/stock-issuance/pending-approvals', async (req, res) => {
  try {
    // Redirect to the main requests endpoint with submitted status
    req.query.status = 'Submitted';
    return app._router.handle({ ...req, url: '/api/stock-issuance/requests' }, res);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending approvals', details: error.message });
  }
});

// Get inventory matches for a specific request (for enhanced approval)
app.get('/api/stock-issuance/requests/:id/inventory-matches', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const { id } = req.params;
    // First, get the requested items
    const requestedItemsResult = await pool.request()
      .input('request_id', sql.UniqueIdentifier, id)
      .query(`
        SELECT 
          sii.id as requested_item_id,
          sii.nomenclature as requested_nomenclature,
          sii.requested_quantity,
          sii.custom_item_name,
          sii.item_type
        FROM stock_issuance_items sii
        WHERE sii.request_id = @request_id
        ORDER BY sii.created_at
      `);

    const requestedItems = requestedItemsResult.recordset;

    // For each requested item, find potential inventory matches
    const itemsWithMatches = await Promise.all(
      requestedItems.map(async (requestedItem) => {
        try {
          // Search for inventory items that match the requested nomenclature
          const searchTerm = requestedItem.requested_nomenclature || requestedItem.custom_item_name || '';
          const searchWords = searchTerm.split(' ').filter(word => word.length > 2);
          
          let inventoryMatches = [];
          
          if (searchWords.length > 0) {
            // Create a dynamic WHERE clause for fuzzy matching
            const searchConditions = searchWords.map((_, index) => `
              (im.nomenclature LIKE '%' + @searchWord${index} + '%' OR 
               im.description LIKE '%' + @searchWord${index} + '%' OR
               im.specifications LIKE '%' + @searchWord${index} + '%')
            `).join(' OR ');

            const matchQuery = `
              SELECT 
                cis.id as inventory_id,
                cis.item_master_id,
                cis.current_quantity as current_stock,
                cis.reserved_quantity as reserved_stock,
                cis.available_quantity as available_stock,
                cis.reorder_point as reorder_level,
                cis.maximum_stock_level as max_stock_level,
                0 as unit_price, -- Add unit price from another source if available
                im.nomenclature,
                im.description,
                im.specifications,
                im.unit as unit_of_measurement,
                'General' as category, -- Get from category table if needed
                'General' as subcategory, -- Get from subcategory table if needed
                im.item_code,
                -- Calculate available quantity (current - reserved)
                (cis.current_quantity - ISNULL(cis.reserved_quantity, 0)) as available_quantity,
                -- Calculate match score based on search terms
                CASE 
                  WHEN im.nomenclature LIKE '%' + @exactMatch + '%' THEN 100
                  WHEN im.nomenclature LIKE '%' + @firstWord + '%' THEN 80
                  ELSE 60
                END as match_score
              FROM current_inventory_stock cis
              INNER JOIN item_masters im ON cis.item_master_id = im.id
              WHERE cis.current_quantity > 0 
                AND (cis.current_quantity - ISNULL(cis.reserved_quantity, 0)) > 0
                AND (${searchConditions})
              ORDER BY match_score DESC, (cis.current_quantity - ISNULL(cis.reserved_quantity, 0)) DESC
            `;

            const matchRequest = pool.request()
              .input('exactMatch', sql.NVarChar, searchTerm)
              .input('firstWord', sql.NVarChar, searchWords[0] || '');

            // Add search word parameters
            searchWords.forEach((word, index) => {
              matchRequest.input(`searchWord${index}`, sql.NVarChar, word);
            });

            const matchResult = await matchRequest.query(matchQuery);
            inventoryMatches = matchResult.recordset;
          }

          return {
            requested_item_id: requestedItem.requested_item_id,
            requested_nomenclature: requestedItem.requested_nomenclature,
            requested_quantity: requestedItem.requested_quantity,
            custom_item_name: requestedItem.custom_item_name,
            item_type: requestedItem.item_type,
            inventory_matches: inventoryMatches,
            match_count: inventoryMatches.length,
            can_fulfill: inventoryMatches.some(match => match.available_quantity >= requestedItem.requested_quantity),
            total_available: inventoryMatches.reduce((sum, match) => sum + match.available_quantity, 0)
          };

        } catch (error) {
          return {
            requested_item_id: requestedItem.requested_item_id,
            requested_nomenclature: requestedItem.requested_nomenclature,
            requested_quantity: requestedItem.requested_quantity,
            custom_item_name: requestedItem.custom_item_name,
            item_type: requestedItem.item_type,
            inventory_matches: [],
            match_count: 0,
            can_fulfill: false,
            total_available: 0,
            error: error.message
          };
        }
      })
    );

    // Calculate summary statistics
    const totalRequestedItems = requestedItems.length;
    const fullyFulfillableItems = itemsWithMatches.filter(item => item.can_fulfill).length;
    const partiallyFulfillableItems = itemsWithMatches.filter(item => 
      !item.can_fulfill && item.total_available > 0
    ).length;
    const notFulfillableItems = itemsWithMatches.filter(item => item.total_available === 0).length;
    res.json({
      success: true,
      request_id: id,
      items_with_matches: itemsWithMatches,
      summary: {
        total_requested_items: totalRequestedItems,
        fully_fulfillable: fullyFulfillableItems,
        partially_fulfillable: partiallyFulfillableItems,
        needs_procurement: notFulfillableItems,
        fulfillment_rate: totalRequestedItems > 0 ? 
          Math.round((fullyFulfillableItems / totalRequestedItems) * 100) : 0
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to find inventory matches', 
      details: error.message 
    });
  }
});

// Approve request with specific inventory allocations
app.post('/api/stock-issuance/requests/:id/approve-with-allocation', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const { id } = req.params;
    const {
      approver_name,
      approver_designation,
      approval_comments,
      item_allocations // Array of { requested_item_id, inventory_item_id, allocated_quantity, decision_type }
    } = req.body;
    const transaction = pool.transaction();
    await transaction.begin();

    try {
      // Update main request status
      await transaction.request()
        .input('id', sql.UniqueIdentifier, id)
        .input('approver_name', sql.NVarChar, approver_name)
        .input('approval_comments', sql.NVarChar, approval_comments)
        .query(`
          UPDATE stock_issuance_requests 
          SET 
            request_status = 'Approved',
            approved_at = GETDATE(),
            approved_by = @approver_name,
            review_comments = @approval_comments,
            updated_at = GETDATE()
          WHERE id = @id
        `);

      // Process each item allocation
      for (const allocation of item_allocations) {
        const {
          requested_item_id,
          inventory_item_id,
          allocated_quantity,
          decision_type, // 'APPROVE_FROM_STOCK', 'APPROVE_FOR_PROCUREMENT', 'REJECT'
          rejection_reason,
          procurement_required_quantity
        } = allocation;

        // Update the requested item with approval details
        await transaction.request()
          .input('requested_item_id', sql.UniqueIdentifier, requested_item_id)
          .input('approved_quantity', sql.Int, allocated_quantity || 0)
          .input('item_status', sql.NVarChar, decision_type === 'REJECT' ? 'Rejected' : 'Approved')
          .input('rejection_reason', sql.NVarChar, rejection_reason)
          .query(`
            UPDATE stock_issuance_items 
            SET 
              approved_quantity = @approved_quantity,
              item_status = @item_status,
              rejection_reason = @rejection_reason,
              updated_at = GETDATE()
            WHERE id = @requested_item_id
          `);

        // If approved from stock, create reservation
        if (decision_type === 'APPROVE_FROM_STOCK' && inventory_item_id && allocated_quantity > 0) {
          // Create stock reservation
          await transaction.request()
            .input('inventory_item_id', sql.UniqueIdentifier, inventory_item_id)
            .input('request_id', sql.UniqueIdentifier, id)
            .input('requested_item_id', sql.UniqueIdentifier, requested_item_id)
            .input('reserved_quantity', sql.Int, allocated_quantity)
            .input('reserved_by', sql.NVarChar, approver_name)
            .input('expires_at', sql.DateTime2, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) // 30 days from now
            .query(`
              INSERT INTO stock_reservations (
                inventory_item_id, request_id, requested_item_id, 
                reserved_quantity, reserved_by, expires_at
              ) VALUES (
                @inventory_item_id, @request_id, @requested_item_id,
                @reserved_quantity, @reserved_by, @expires_at
              )
            `);

          // Update inventory reserved stock
          await transaction.request()
            .input('inventory_item_id', sql.UniqueIdentifier, inventory_item_id)
            .input('reserved_quantity', sql.Int, allocated_quantity)
            .query(`
              UPDATE current_inventory_stock 
              SET 
                reserved_quantity = ISNULL(reserved_quantity, 0) + @reserved_quantity,
                available_quantity = current_quantity - (ISNULL(reserved_quantity, 0) + @reserved_quantity),
                last_updated = GETDATE()
              WHERE id = @inventory_item_id
            `);
        }

        // If procurement required, create procurement request
        if (decision_type === 'APPROVE_FOR_PROCUREMENT' && procurement_required_quantity > 0) {
          await transaction.request()
            .input('original_request_id', sql.UniqueIdentifier, id)
            .input('requested_item_id', sql.UniqueIdentifier, requested_item_id)
            .input('required_quantity', sql.Int, procurement_required_quantity)
            .input('created_by', sql.NVarChar, approver_name)
            .query(`
              INSERT INTO procurement_requests (
                original_request_id, requested_item_id, required_quantity, created_by
              ) VALUES (
                @original_request_id, @requested_item_id, @required_quantity, @created_by
              )
            `);
        }

        // Record the approval decision
        await transaction.request()
          .input('request_id', sql.UniqueIdentifier, id)
          .input('requested_item_id', sql.UniqueIdentifier, requested_item_id)
          .input('decision_type', sql.NVarChar, decision_type)
          .input('inventory_item_id', sql.UniqueIdentifier, inventory_item_id)
          .input('approved_quantity', sql.Int, allocated_quantity || 0)
          .input('procurement_required_quantity', sql.Int, procurement_required_quantity || 0)
          .input('rejection_reason', sql.NVarChar, rejection_reason)
          .input('approver_id', sql.NVarChar, approver_name)
          .query(`
            INSERT INTO stock_issuance_approval_decisions (
              request_id, requested_item_id, decision_type, inventory_item_id,
              approved_quantity, procurement_required_quantity, rejection_reason, approver_id
            ) VALUES (
              @request_id, @requested_item_id, @decision_type, @inventory_item_id,
              @approved_quantity, @procurement_required_quantity, @rejection_reason, @approver_id
            )
          `);
      }

      await transaction.commit();

      const approvedCount = item_allocations.filter(a => a.decision_type === 'APPROVE_FROM_STOCK').length;
      const procurementCount = item_allocations.filter(a => a.decision_type === 'APPROVE_FOR_PROCUREMENT').length;
      const rejectedCount = item_allocations.filter(a => a.decision_type === 'REJECT').length;
      res.json({
        success: true,
        message: 'Request approved with specific allocations',
        summary: {
          approved_from_stock: approvedCount,
          requires_procurement: procurementCount,
          rejected: rejectedCount
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    res.status(500).json({ error: 'Failed to approve request with allocations', details: error.message });
  }
});

// Finalize stock issuance request
app.put('/api/stock-issuance/requests/:id/finalize', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const { id } = req.params;
    const { finalized_by } = req.body;
    const now = new Date();
    // First check if request exists and is not already finalized
    const checkResult = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query('SELECT is_finalized, request_status FROM stock_issuance_requests WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Stock issuance request not found' });
    }

    if (checkResult.recordset[0].is_finalized) {
      return res.status(400).json({ error: 'Stock issuance request is already finalized' });
    }

    // Only approved or issued requests can be finalized
    if (!['Approved', 'Issued'].includes(checkResult.recordset[0].request_status)) {
      return res.status(400).json({ error: 'Only approved or issued requests can be finalized. Please process the request first.' });
    }

    // Update request to finalized status
    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('finalized_by', sql.NVarChar, finalized_by)
      .input('finalized_at', sql.DateTime2, now)
      .query(`
        UPDATE stock_issuance_requests 
        SET 
          is_finalized = 1,
          finalized_by = @finalized_by,
          finalized_at = @finalized_at,
          updated_at = GETDATE()
        WHERE id = @id
      `);
    res.json({
      success: true,
      message: 'Stock issuance request finalized successfully',
      finalized_at: now,
      finalized_by: finalized_by
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to finalize request', details: error.message });
  }
});

// =============================================================================
// STOCK RETURN ENDPOINTS
// =============================================================================

// Create a stock return with return items
app.post('/api/stock-returns', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const { 
      return_date,
      returned_by,
      verified_by,
      return_notes,
      return_status,
      return_items 
    } = req.body;

    const transaction = pool.transaction();
    await transaction.begin();

    try {
      // Create stock return record
      const returnResult = await transaction.request()
        .input('return_date', return_date)
        .input('returned_by', returned_by)
        .input('verified_by', verified_by)
        .input('return_notes', return_notes)
        .input('return_status', return_status)
        .query(`
          INSERT INTO stock_returns (return_date, returned_by, verified_by, return_notes, return_status)
          OUTPUT INSERTED.id
          VALUES (@return_date, @returned_by, @verified_by, @return_notes, @return_status)
        `);

      const returnId = returnResult.recordset[0].id;

      // Process each return item
      for (const item of return_items) {
        // Create return item record
        await transaction.request()
          .input('return_id', returnId)
          .input('issued_item_id', item.issued_item_id)
          .input('nomenclature', item.nomenclature)
          .input('return_quantity', item.return_quantity)
          .input('condition_on_return', item.condition_on_return)
          .input('damage_description', item.damage_description)
          .query(`
            INSERT INTO stock_return_items 
            (return_id, issued_item_id, nomenclature, return_quantity, condition_on_return, damage_description)
            VALUES (@return_id, @issued_item_id, @nomenclature, @return_quantity, @condition_on_return, @damage_description)
          `);

        // Update the issuance item status
        await transaction.request()
          .input('issued_item_id', item.issued_item_id)
          .query(`
            UPDATE stock_issuance_items 
            SET status = 'Returned' 
            WHERE id = @issued_item_id
          `);

        // Add back to inventory (for good condition items)
        if (item.condition_on_return === 'Good') {
          await transaction.request()
            .input('date', return_date)
            .input('item', item.nomenclature)
            .input('quantity', item.return_quantity)
            .input('department', returned_by)
            .query(`
              INSERT INTO stock_transactions 
              (date, type, item, quantity, unit_price, total_value, vendor, department, tender_ref, remarks)
              VALUES (@date, 'IN', @item, @quantity, 0, 0, NULL, @department, NULL, 'Stock return - Good condition')
            `);
        }
      }

      await transaction.commit();
      res.json({ 
        success: true, 
        return_id: returnId,
        message: `Successfully processed return for ${return_items.length} items`
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    res.status(500).json({ error: 'Failed to create stock return', details: error.message });
  }
});

// Get all stock returns
app.get('/api/stock-returns', async (req, res) => {
  try {
    if (!pool) {
      await sql.connect(sqlConfig);
    }
    const result = await sql.query`
      SELECT 
        sr.id,
        sr.return_date,
        sr.returned_by,
        sr.verified_by,
        sr.return_notes,
        sr.return_status,
        sr.created_at,
        sr.updated_at
      FROM stock_returns sr
      ORDER BY sr.created_at DESC
    `;
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stock returns', details: error.message });
  }
});

// =============================================================================
// TENDER ENDPOINTS
// =============================================================================

// GET all tenders
app.get('/api/tenders', async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT DISTINCT 
        t.id, 
        t.title, 
        t.reference_number, 
        t.description, 
        t.estimated_value, 
        t.publish_date, 
        t.publication_date, 
        t.submission_date, 
        t.submission_deadline, 
        t.opening_date, 
        t.document_path, 
        t.created_at, 
        t.updated_at, 
        t.created_by, 
        t.advertisement_date, 
        t.procedure_adopted, 
        t.procurement_method, 
        t.publication_daily, 
        t.contract_file_path, 
        t.loi_file_path, 
        t.noting_file_path, 
        t.po_file_path, 
        t.rfp_file_path, 
        t.tender_number, 
        t.tender_type, 
        t.office_ids, 
        t.wing_ids, 
        t.dec_ids, 
        t.tender_spot_type, 
        t.vendor_id, 
        t.tender_status, 
        t.individual_total, 
        t.actual_price_total, 
        t.is_finalized, 
        t.finalized_at, 
        t.finalized_by,
        v.vendor_name,
        v.vendor_code,
        dbo.GetOfficeNames(t.office_ids) as office_names,
        dbo.GetWingNames(t.wing_ids) as wing_names,
        dbo.GetDecNames(t.dec_ids) as dec_names
      FROM tenders t
      LEFT JOIN vendors v ON t.vendor_id = v.id
      ORDER BY t.created_at DESC
    `);

    // Transform data for frontend - convert comma-separated strings to arrays
    const transformedData = result.recordset.map(tender => ({
      ...tender,
      officeIds: tender.office_ids ? tender.office_ids.split(',').map(id => id.trim()).filter(id => id) : [],
      wingIds: tender.wing_ids ? tender.wing_ids.split(',').map(id => id.trim()).filter(id => id) : [],
      decIds: tender.dec_ids ? tender.dec_ids.split(',').map(id => id.trim()).filter(id => id) : []
    }));

    res.json(transformedData);

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tenders', details: error.message });
  }
});

// GET single tender by ID
app.get('/api/tenders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`
        SELECT * FROM View_tenders
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Tender not found' });
    }

    // Transform data for frontend - convert comma-separated strings to arrays
    const tender = result.recordset[0];
    const transformedTender = {
      ...tender,
      officeIds: tender.office_ids ? tender.office_ids.split(',').map(id => id.trim()).filter(id => id) : [],
      wingIds: tender.wing_ids ? tender.wing_ids.split(',').map(id => id.trim()).filter(id => id) : [],
      decIds: tender.dec_ids ? tender.dec_ids.split(',').map(id => id.trim()).filter(id => id) : []
    };

    res.json(transformedTender);

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tender', details: error.message });
  }
});

// GET tender report data with proper items structure
app.get('/api/view-tenders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Searching for tender ID:', id);
    
    // Get tender basic information with organizational details
    const tenderResult = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`
        SELECT 
          t.*,
          o.strOfficeName as office_name,
          w.Name as wing_name,
          v.vendor_name,
          v.vendor_code,
          dbo.GetOfficeNames(t.office_ids) as office_names,
          dbo.GetWingNames(t.wing_ids) as wing_names,
          dbo.GetDecNames(t.dec_ids) as dec_names
        FROM tenders t
        LEFT JOIN tblOffices o ON t.office_id = o.intOfficeID
        LEFT JOIN WingsInformation w ON t.wing_id = w.Id
        LEFT JOIN vendors v ON t.vendor_id = v.id
        WHERE t.id = @id
      `);

    if (tenderResult.recordset.length === 0) {
      console.log('❌ Tender not found in database');
      return res.status(404).json({ error: 'Tender not found' });
    }

    const tender = tenderResult.recordset[0];
    console.log('✅ Found tender:', tender.title);

    // Get tender items separately
    const itemsResult = await pool.request()
      .input('tender_id', sql.UniqueIdentifier, id)
      .query(`
        SELECT 
          ti.*,
          im.category_id,
          im.sub_category_id,
          c.category_name,
          sc.sub_category_name
        FROM tender_items ti
        LEFT JOIN item_masters im ON ti.item_master_id = im.id
        LEFT JOIN categories c ON im.category_id = c.id
        LEFT JOIN sub_categories sc ON im.sub_category_id = sc.id
        WHERE ti.tender_id = @tender_id
        ORDER BY ti.created_at
      `);

    console.log('📦 Found items:', itemsResult.recordset.length);

    // Combine tender data with items
    const tenderData = {
      ...tender,
      items: itemsResult.recordset
    };

    res.json(tenderData);

  } catch (error) {
    console.error('❌ Error fetching tender data:', error);
    res.status(500).json({ error: 'Failed to fetch tender data', details: error.message });
  }
});

// POST create new tender
app.post('/api/tenders', async (req, res) => {
  console.log('🚀 POST /api/tenders - Request received');
  console.log('📋 Request body keys:', Object.keys(req.body));
  console.log('📋 Full request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const {
      reference_number,
      referenceNumber, // Frontend sends this
      title,
      description,
      tender_type,
      estimated_value,
      estimatedValue, // Frontend sends this
      submission_deadline,
      submissionDeadline, // Frontend sends this
      status, // This should always be 'Draft' for new tenders
      tender_status, // This comes from the form's Tender Status combobox
      created_by,
      office_id,
      wing_id,
      dec_id,
      officeIds, // Frontend sends arrays
      wingIds,
      decIds,
      tender_spot_type,
      procurement_method,
      procurementMethod, // Frontend sends this
      publication_daily,
      publicationDailies, // Frontend sends this
      // Missing fields that should be included
      individual_total,
      individualTotal, // Frontend alternative
      actual_price_total,
      actualPriceTotal, // Frontend alternative
      po_number,
      poNumber, // Frontend alternative
      award_amount,
      awardAmount, // Frontend alternative
      contract_start_date,
      contractStartDate, // Frontend alternative
      contract_end_date,
      contractEndDate, // Frontend alternative
      performance_guarantee,
      performanceGuarantee, // Frontend alternative
      advance_payment,
      advancePayment, // Frontend alternative
      // Date fields from frontend
      publishDate,
      publicationDate,
      submissionDate,
      openingDate,
      advertisementDate,
      biddingProcedure,
      eligibilityCriteria,
      // File paths
      rfp_file_path,
      contract_file_path,
      loi_file_path,
      po_file_path,
      noting_file_path,
      // Vendor information
      vendor_id,
      vendor,
      items // Add items to destructuring
    } = req.body;

    console.log('🔍 FULL REQUEST BODY DEBUG:');
    console.log('officeIds:', officeIds);
    console.log('wingIds:', wingIds);
    console.log('decIds:', decIds);
    console.log('office_id:', office_id);
    console.log('wing_id:', wing_id);
    console.log('dec_id:', dec_id);

    const tenderId = uuidv4();
    const now = new Date().toISOString();

    // Process arrays for multi-select fields - store as comma-separated strings
    const processedOfficeIds = officeIds?.length > 0 ? officeIds.join(',') : (office_id || null);
    const processedWingIds = wingIds?.length > 0 ? wingIds.join(',') : (wing_id || null); 
    const processedDecIds = decIds?.length > 0 ? decIds.join(',') : (dec_id || null);
    
    // For backward compatibility, also set singular fields (first element)
    const processedOfficeId = officeIds?.length > 0 ? officeIds[0] : office_id;
    const processedWingId = wingIds?.length > 0 ? wingIds[0] : wing_id; 
    const processedDecId = decIds?.length > 0 ? decIds[0] : dec_id;

    // Debug: Log what we're processing
    console.log('🔍 DEBUG CREATE - Organizational data processing:');
    console.log('Input arrays:', { officeIds, wingIds, decIds });
    console.log('Processed strings:', { processedOfficeIds, processedWingIds, processedDecIds });
    console.log('Processed singles:', { processedOfficeId, processedWingId, processedDecId });
    
    // Process vendor ID
    const processedVendorId = vendor_id || vendor?.vendorId;

    // Validate and process status field for finalization logic
    const validStatuses = ['Draft', 'Published', 'Finalized'];
    let processedStatus = 'Draft'; // Default to Draft for new tenders
    
    if (status && validStatuses.includes(status)) {
      processedStatus = status;
    } else if (status === 'Finalize') {
      // If frontend sends "Finalize", convert it to "Finalized"
      processedStatus = 'Finalized';
    }

    // Validate and process tender_status - this is separate from status field
    const validTenderStatuses = ['Draft', 'Published', 'Submitted', 'Under Review', 'Awarded', 'Cancelled'];
    let processedTenderStatus = 'Draft'; // Default to Draft for new tenders
    
    if (tender_status && validTenderStatuses.includes(tender_status)) {
      processedTenderStatus = tender_status;
    }

    console.log('🔍 Creating tender with status:', processedStatus, 'from input:', status);
    console.log('🔍 Creating tender with tender_status:', processedTenderStatus, 'from input:', tender_status);
    
    // Debug: Log organizational data processing
    console.log('🔍 Organizational data processing:');
    console.log('  - Raw officeIds from frontend:', officeIds);
    console.log('  - Raw wingIds from frontend:', wingIds);
    console.log('  - Raw decIds from frontend:', decIds);
    console.log('  - Processed officeIds (comma-separated):', processedOfficeIds);
    console.log('  - Processed wingIds (comma-separated):', processedWingIds);
    console.log('  - Processed decIds (comma-separated):', processedDecIds);
    console.log('  - Processed vendorId:', processedVendorId);

    // Start a transaction to ensure tender and items are created together
    const transaction = pool.transaction();
    await transaction.begin();

    try {
      // Create tender first with ALL database fields
      const result = await transaction.request()
        .input('id', sql.UniqueIdentifier, tenderId)
        .input('reference_number', sql.NVarChar, referenceNumber || reference_number)
        .input('title', sql.NVarChar, title)
        .input('description', sql.NVarChar, description)
        .input('tender_type', sql.NVarChar, tender_type || tender_spot_type)
        .input('estimated_value', sql.Int, estimatedValue || estimated_value)
        .input('submission_deadline', sql.DateTime2, submissionDeadline || submission_deadline)
        .input('status', sql.NVarChar, processedStatus) // Use processed status (Draft/Published/Finalized)
        .input('tender_status', sql.NVarChar, processedTenderStatus) // Use processed tender_status (business workflow status)
        .input('created_by', sql.NVarChar, created_by)
        .input('office_id', sql.NVarChar, processedOfficeId ? processedOfficeId.toString() : null)
        .input('wing_id', sql.NVarChar, processedWingId ? processedWingId.toString() : null)
        .input('dec_id', sql.NVarChar, processedDecId ? processedDecId.toString() : null)
        .input('office_ids', sql.NVarChar, processedOfficeIds)
        .input('wing_ids', sql.NVarChar, processedWingIds)
        .input('dec_ids', sql.NVarChar, processedDecIds)
        .input('tender_spot_type', sql.NVarChar, tender_spot_type)
        .input('procurement_method', sql.NVarChar, procurementMethod || procurement_method)
        .input('publication_daily', sql.NVarChar, publicationDailies || publication_daily)
        // Only include existing database fields
        .input('individual_total', sql.NVarChar, individualTotal || individual_total)
        .input('actual_price_total', sql.Int, actualPriceTotal || actual_price_total)
        // Date fields
        .input('publish_date', sql.Date, publishDate ? new Date(publishDate) : null)
        .input('publication_date', sql.Date, publicationDate ? new Date(publicationDate) : null)
        .input('submission_date', sql.Date, submissionDate ? new Date(submissionDate) : null)
        .input('opening_date', sql.Date, openingDate ? new Date(openingDate) : null)
        .input('advertisement_date', sql.Date, advertisementDate ? new Date(advertisementDate) : null)
        // Additional fields
        .input('procedure_adopted', sql.NVarChar, biddingProcedure)
        // File paths
        .input('rfp_file_path', sql.NVarChar, rfp_file_path)
        .input('contract_file_path', sql.NVarChar, contract_file_path)
        .input('loi_file_path', sql.NVarChar, loi_file_path)
        .input('po_file_path', sql.NVarChar, po_file_path)
        .input('noting_file_path', sql.NVarChar, noting_file_path)
        // Vendor information
        .input('vendor_id', sql.UniqueIdentifier, processedVendorId || null)
        .input('created_at', sql.DateTime2, now)
        .input('updated_at', sql.DateTime2, now)
        .query(`
          INSERT INTO tenders (
            id, reference_number, title, description, tender_type, estimated_value,
            submission_deadline, status, tender_status, created_by, office_id, wing_id, dec_id,
            office_ids, wing_ids, dec_ids,
            tender_spot_type, procurement_method, publication_daily,
            individual_total, actual_price_total,
            publish_date, publication_date, submission_date, opening_date, advertisement_date,
            procedure_adopted,
            rfp_file_path, contract_file_path, loi_file_path, po_file_path, noting_file_path,
            vendor_id, created_at, updated_at
          ) VALUES (
            @id, @reference_number, @title, @description, @tender_type, @estimated_value,
            @submission_deadline, @status, @tender_status, @created_by, @office_id, @wing_id, @dec_id,
            @office_ids, @wing_ids, @dec_ids,
            @tender_spot_type, @procurement_method, @publication_daily,
            @individual_total, @actual_price_total,
            @publish_date, @publication_date, @submission_date, @opening_date, @advertisement_date,
            @procedure_adopted,
            @rfp_file_path, @contract_file_path, @loi_file_path, @po_file_path, @noting_file_path,
            @vendor_id, @created_at, @updated_at
          )
        `);

      // Create tender items if provided
      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          const itemId = uuidv4();
          
          await transaction.request()
            .input('id', sql.UniqueIdentifier, itemId)
            .input('tender_id', sql.UniqueIdentifier, tenderId)
            .input('item_master_id', sql.UniqueIdentifier, item.itemMasterId || item.item_master_id || null)
            .input('nomenclature', sql.NVarChar, item.nomenclature)
            .input('quantity', sql.Int, item.quantity)
            .input('estimated_unit_price', sql.Int, item.estimatedUnitPrice || item.estimated_unit_price || 0)
            .input('actual_unit_price', sql.Int, item.actualUnitPrice || item.actual_unit_price || 0)
            .input('total_amount', sql.Int, item.totalAmount || item.total_amount || (item.quantity * (item.estimatedUnitPrice || item.estimated_unit_price || 0)))
            .input('specifications', sql.NVarChar, item.specifications || null)
            .input('remarks', sql.NVarChar, item.remarks || null)
            .input('status', sql.NVarChar, item.status || 'Active')
            .input('created_at', sql.DateTime2, now)
            .input('updated_at', sql.DateTime2, now)
            .query(`
              INSERT INTO tender_items (
                id, tender_id, item_master_id, nomenclature, quantity, 
                estimated_unit_price, actual_unit_price, total_amount, 
                specifications, remarks, status, created_at, updated_at
              ) VALUES (
                @id, @tender_id, @item_master_id, @nomenclature, @quantity,
                @estimated_unit_price, @actual_unit_price, @total_amount,
                @specifications, @remarks, @status, @created_at, @updated_at
              )
            `);
        }
      }

      await transaction.commit();
      console.log('✅ Tender created successfully!', {
        id: tenderId,
        title: title,
        referenceNumber: referenceNumber || reference_number,
        items_count: items?.length || 0
      });
      
      res.json({ 
        success: true, 
        id: tenderId, 
        reference_number: referenceNumber || reference_number,
        title: title,
        tender_spot_type: tender_spot_type,
        items_count: items?.length || 0,
        vendor_id: processedVendorId,
        publish_date: publishDate,
        submission_date: submissionDate,
        opening_date: openingDate,
        message: 'Tender created successfully with all fields and items'
      });

    } catch (error) {
      console.error('❌ Database transaction error:', error);
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ Overall tender creation error:', error);
    res.status(500).json({ error: 'Failed to create tender', details: error.message });
  }
});

// PUT update tender
app.put('/api/tenders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      reference_number,
      referenceNumber,
      title,
      description,
      tender_type,
      estimated_value,
      estimatedValue,
      submission_deadline,
      submissionDeadline,
      status, // Workflow status (Draft, Published, etc.)
      tender_status, // Business status from form combobox
      office_id,
      wing_id,
      dec_id,
      officeIds,
      wingIds,
      decIds,
      tender_spot_type,
      procurement_method,
      procurementMethod,
      publication_daily,
      publicationDailies,
      individual_total,
      actual_price_total,
      // Date fields
      publishDate,
      publicationDate,
      submissionDate,
      openingDate,
      advertisementDate,
      biddingProcedure,
      eligibilityCriteria,
      // File paths
      rfp_file_path,
      contract_file_path,
      loi_file_path,
      po_file_path,
      noting_file_path,
      // Vendor information
      vendor_id,
      vendor
    } = req.body;

    console.log('🔍 UPDATE FULL REQUEST BODY DEBUG:');
    console.log('officeIds:', officeIds);
    console.log('wingIds:', wingIds);
    console.log('decIds:', decIds);
    console.log('office_id:', office_id);
    console.log('wing_id:', wing_id);
    console.log('dec_id:', dec_id);

    const now = new Date().toISOString();

    // Process arrays for multi-select fields - store as comma-separated strings
    const processedOfficeIds = officeIds?.length > 0 ? officeIds.join(',') : (office_id || null);
    const processedWingIds = wingIds?.length > 0 ? wingIds.join(',') : (wing_id || null); 
    const processedDecIds = decIds?.length > 0 ? decIds.join(',') : (dec_id || null);
    
    // For backward compatibility, also set singular fields (first element)
    const processedOfficeId = officeIds?.length > 0 ? officeIds[0] : office_id;
    const processedWingId = wingIds?.length > 0 ? wingIds[0] : wing_id; 
    const processedDecId = decIds?.length > 0 ? decIds[0] : dec_id;

    // Debug: Log what we're processing
    console.log('🔍 DEBUG UPDATE - Organizational data processing:');
    console.log('Input arrays:', { officeIds, wingIds, decIds });
    console.log('Processed strings:', { processedOfficeIds, processedWingIds, processedDecIds });
    console.log('Processed singles:', { processedOfficeId, processedWingId, processedDecId });
    
    // Process vendor ID
    const processedVendorId = vendor_id || vendor?.vendorId;

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('reference_number', sql.NVarChar, referenceNumber || reference_number)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description)
      .input('tender_type', sql.NVarChar, tender_type)
      .input('estimated_value', sql.Int, estimatedValue || estimated_value)
      .input('submission_deadline', sql.DateTime2, submissionDeadline || submission_deadline)
      .input('status', sql.NVarChar, status)
      .input('tender_status', sql.NVarChar, tender_status)
      .input('office_id', sql.NVarChar, processedOfficeId ? processedOfficeId.toString() : null)
      .input('wing_id', sql.NVarChar, processedWingId ? processedWingId.toString() : null)
      .input('dec_id', sql.NVarChar, processedDecId ? processedDecId.toString() : null)
      .input('office_ids', sql.NVarChar, processedOfficeIds)
      .input('wing_ids', sql.NVarChar, processedWingIds)
      .input('dec_ids', sql.NVarChar, processedDecIds)
      .input('tender_spot_type', sql.NVarChar, tender_spot_type)
      .input('procurement_method', sql.NVarChar, procurementMethod || procurement_method)
      .input('publication_daily', sql.NVarChar, publicationDailies || publication_daily)
      .input('individual_total', sql.NVarChar, individual_total)
      .input('actual_price_total', sql.Int, actual_price_total)
      // Date fields
      .input('publish_date', sql.Date, publishDate ? new Date(publishDate) : null)
      .input('publication_date', sql.Date, publicationDate ? new Date(publicationDate) : null)
      .input('submission_date', sql.Date, submissionDate ? new Date(submissionDate) : null)
      .input('opening_date', sql.Date, openingDate ? new Date(openingDate) : null)
      .input('advertisement_date', sql.Date, advertisementDate ? new Date(advertisementDate) : null)
      // Additional fields
      .input('procedure_adopted', sql.NVarChar, biddingProcedure)
      // File paths
      .input('rfp_file_path', sql.NVarChar, rfp_file_path)
      .input('contract_file_path', sql.NVarChar, contract_file_path)
      .input('loi_file_path', sql.NVarChar, loi_file_path)
      .input('po_file_path', sql.NVarChar, po_file_path)
      .input('noting_file_path', sql.NVarChar, noting_file_path)
      // Vendor information
      .input('vendor_id', sql.UniqueIdentifier, processedVendorId || null)
      .input('updated_at', sql.DateTime2, now)
      .query(`
        UPDATE tenders SET
          reference_number = @reference_number,
          title = @title,
          description = @description,
          tender_type = @tender_type,
          estimated_value = @estimated_value,
          submission_deadline = @submission_deadline,
          status = @status,
          tender_status = @tender_status,
          office_id = @office_id,
          wing_id = @wing_id,
          dec_id = @dec_id,
          office_ids = @office_ids,
          wing_ids = @wing_ids,
          dec_ids = @dec_ids,
          tender_spot_type = @tender_spot_type,
          procurement_method = @procurement_method,
          publication_daily = @publication_daily,
          individual_total = @individual_total,
          actual_price_total = @actual_price_total,
          publish_date = @publish_date,
          publication_date = @publication_date,
          submission_date = @submission_date,
          opening_date = @opening_date,
          advertisement_date = @advertisement_date,
          procedure_adopted = @procedure_adopted,
          rfp_file_path = @rfp_file_path,
          contract_file_path = @contract_file_path,
          loi_file_path = @loi_file_path,
          po_file_path = @po_file_path,
          noting_file_path = @noting_file_path,
          vendor_id = @vendor_id,
          updated_at = @updated_at
        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Tender not found' });
    }
    res.json({ 
      success: true, 
      id: id,
      message: 'Tender updated successfully'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to update tender', details: error.message });
  }
});

// DELETE tender
app.delete('/api/tenders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query('DELETE FROM tenders WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Tender not found' });
    }
    res.json({ 
      success: true, 
      message: 'Tender deleted successfully'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tender', details: error.message });
  }
});

// PUT finalize tender
app.put('/api/tenders/:id/finalize', async (req, res) => {
  try {
    const { id } = req.params;
    const { finalized_by } = req.body;

    console.log('🔄 Finalizing tender:', { id, finalized_by });

    const now = new Date().toISOString();

    // First check if tender exists and is not already finalized
    const checkResult = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query('SELECT is_finalized, status FROM tenders WHERE id = @id');

    console.log('📋 Tender check result:', checkResult.recordset);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Tender not found' });
    }

    const tender = checkResult.recordset[0];
    
    // Handle different data types for is_finalized (could be bit, boolean, string)
    const isAlreadyFinalized = tender.is_finalized === true || 
                              tender.is_finalized === 1 || 
                              tender.is_finalized === '1' ||
                              tender.is_finalized === 'true';

    if (isAlreadyFinalized) {
      return res.status(400).json({ error: 'Tender is already finalized' });
    }

    console.log('⚡ Updating tender to finalized status...');

    // Update tender to finalized status - use default user if finalized_by is not a valid GUID
    // For consistency with how we handle user IDs throughout the system
    const defaultUserId = 'DEV-USER-001'; // Same as DEFAULT_SESSION.user_id
    const finalizedByUser = finalized_by || defaultUserId;

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('finalized_by', sql.NVarChar, finalizedByUser)
      .input('finalized_at', sql.DateTime2, now)
      .input('updated_at', sql.DateTime2, now)
      .query(`
        UPDATE tenders SET
          is_finalized = 1,
          finalized_by = @finalized_by,
          finalized_at = @finalized_at,
          updated_at = @updated_at
        WHERE id = @id
      `);

    console.log('✅ Tender finalized successfully:', { id, finalized_by });

    res.json({ 
      success: true, 
      id: id,
      message: 'Tender finalized successfully',
      finalized_at: now,
      finalized_by: finalized_by
    });

  } catch (error) {
    console.error('❌ Error finalizing tender:', error);
    res.status(500).json({ error: 'Failed to finalize tender', details: error.message });
  }
});

// =============================================================================
// TENDER ITEMS ENDPOINTS
// =============================================================================

// GET tender items by tender ID
app.get('/api/tenders/:tenderId/items', async (req, res) => {
  try {
    const { tenderId } = req.params;
    
    const result = await pool.request()
      .input('tender_id', sql.UniqueIdentifier, tenderId)
      .query(`
        SELECT 
          ti.*,
          im.nomenclature as item_name
        FROM tender_items ti
        LEFT JOIN item_masters im ON ti.item_master_id = im.id
        WHERE ti.tender_id = @tender_id
        ORDER BY ti.created_at
      `);
    res.json(result.recordset);

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tender items', details: error.message });
  }
});

// POST create tender item
app.post('/api/tenders/:tenderId/items', async (req, res) => {
  try {
    const { tenderId } = req.params;
    const {
      item_master_id,
      nomenclature,
      quantity,
      estimated_unit_price,
      actual_unit_price,
      total_amount,
      specifications,
      remarks,
      status
    } = req.body;

    const itemId = uuidv4();
    const now = new Date().toISOString();

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, itemId)
      .input('tender_id', sql.UniqueIdentifier, tenderId)
      .input('item_master_id', sql.UniqueIdentifier, item_master_id)
      .input('nomenclature', sql.NVarChar, nomenclature)
      .input('quantity', sql.Int, quantity)
      .input('estimated_unit_price', sql.Int, estimated_unit_price)
      .input('actual_unit_price', sql.Int, actual_unit_price)
      .input('total_amount', sql.Int, total_amount)
      .input('specifications', sql.NVarChar, specifications)
      .input('remarks', sql.NVarChar, remarks)
      .input('status', sql.NVarChar, status || 'Active')
      .input('created_at', sql.DateTime2, now)
      .input('updated_at', sql.DateTime2, now)
      .query(`
        INSERT INTO tender_items (
          id, tender_id, item_master_id, nomenclature, quantity, 
          estimated_unit_price, actual_unit_price, total_amount, 
          specifications, remarks, status, created_at, updated_at
        ) VALUES (
          @id, @tender_id, @item_master_id, @nomenclature, @quantity,
          @estimated_unit_price, @actual_unit_price, @total_amount,
          @specifications, @remarks, @status, @created_at, @updated_at
        )
      `);
    res.json({ 
      success: true, 
      id: itemId,
      message: 'Tender item created successfully'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to create tender item', details: error.message });
  }
});

// =============================================================================
// DELIVERY ENDPOINTS
// =============================================================================

// GET all deliveries
app.get('/api/deliveries', async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT 
        d.*,
        t.reference_number as tender_reference,
        t.title as tender_title,
        t.is_finalized as tender_is_finalized
      FROM deliveries d
      LEFT JOIN tenders t ON d.tender_id = t.id
      ORDER BY d.created_at DESC
    `);
    res.json(result.recordset);

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deliveries', details: error.message });
  }
});

// GET single delivery by ID
app.get('/api/deliveries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`
        SELECT 
          d.*,
          t.reference_number as tender_reference,
          t.title as tender_title,
          t.is_finalized as tender_is_finalized
        FROM deliveries d
        LEFT JOIN tenders t ON d.tender_id = t.id
        WHERE d.id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    res.json(result.recordset[0]);

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch delivery', details: error.message });
  }
});

// POST create new delivery
app.post('/api/deliveries', async (req, res) => {
  try {
    const {
      delivery_number,
      tender_id,
      delivery_personnel,
      delivery_date,
      delivery_notes,
      delivery_chalan,
      chalan_file_path
    } = req.body;

    const deliveryId = uuidv4();
    const now = new Date().toISOString();

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, deliveryId)
      .input('delivery_number', sql.Int, delivery_number)
      .input('tender_id', sql.UniqueIdentifier, tender_id)
      .input('delivery_personnel', sql.NVarChar, delivery_personnel)
      .input('delivery_date', sql.NVarChar, delivery_date)
      .input('delivery_notes', sql.NVarChar, delivery_notes)
      .input('delivery_chalan', sql.NVarChar, delivery_chalan)
      .input('chalan_file_path', sql.NVarChar, chalan_file_path)
      .input('created_at', sql.DateTime2, now)
      .input('updated_at', sql.DateTime2, now)
      .query(`
        INSERT INTO deliveries (
          id, delivery_number, tender_id, delivery_personnel, delivery_date,
          delivery_notes, delivery_chalan, chalan_file_path, created_at, updated_at
        ) VALUES (
          @id, @delivery_number, @tender_id, @delivery_personnel, @delivery_date,
          @delivery_notes, @delivery_chalan, @chalan_file_path, @created_at, @updated_at
        )
      `);
    res.json({ 
      success: true, 
      id: deliveryId, 
      delivery_number: delivery_number,
      message: 'Delivery created successfully'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to create delivery', details: error.message });
  }
});

// PUT update delivery
app.put('/api/deliveries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      delivery_number,
      tender_id,
      delivery_personnel,
      delivery_date,
      delivery_notes,
      delivery_chalan,
      chalan_file_path
    } = req.body;

    // Check if tender is finalized or delivery is finalized
    const checkResult = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`
        SELECT d.is_finalized, t.is_finalized as tender_is_finalized
        FROM deliveries d
        LEFT JOIN tenders t ON d.tender_id = t.id
        WHERE d.id = @id
      `);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    const { is_finalized, tender_is_finalized } = checkResult.recordset[0];
    
    if (tender_is_finalized) {
      return res.status(400).json({ 
        error: 'Cannot update acquisition - tender is finalized',
        reason: 'tender_finalized'
      });
    }

    if (is_finalized) {
      return res.status(400).json({ 
        error: 'Cannot update acquisition - delivery is finalized',
        reason: 'delivery_finalized'
      });
    }

    const now = new Date().toISOString();

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('delivery_number', sql.Int, delivery_number)
      .input('tender_id', sql.UniqueIdentifier, tender_id)
      .input('delivery_personnel', sql.NVarChar, delivery_personnel)
      .input('delivery_date', sql.NVarChar, delivery_date)
      .input('delivery_notes', sql.NVarChar, delivery_notes)
      .input('delivery_chalan', sql.NVarChar, delivery_chalan)
      .input('chalan_file_path', sql.NVarChar, chalan_file_path)
      .input('updated_at', sql.DateTime2, now)
      .query(`
        UPDATE deliveries SET
          delivery_number = @delivery_number,
          tender_id = @tender_id,
          delivery_personnel = @delivery_personnel,
          delivery_date = @delivery_date,
          delivery_notes = @delivery_notes,
          delivery_chalan = @delivery_chalan,
          chalan_file_path = @chalan_file_path,
          updated_at = @updated_at
        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    res.json({ 
      success: true, 
      id: id,
      message: 'Delivery updated successfully'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to update delivery', details: error.message });
  }
});

// DELETE delivery
app.delete('/api/deliveries/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if tender is finalized or delivery is finalized
    const checkResult = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`
        SELECT d.is_finalized, t.is_finalized as tender_is_finalized
        FROM deliveries d
        LEFT JOIN tenders t ON d.tender_id = t.id
        WHERE d.id = @id
      `);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    const { is_finalized, tender_is_finalized } = checkResult.recordset[0];
    
    if (tender_is_finalized) {
      return res.status(400).json({ 
        error: 'Cannot delete acquisition - tender is finalized',
        reason: 'tender_finalized'
      });
    }

    if (is_finalized) {
      return res.status(400).json({ 
        error: 'Cannot delete acquisition - delivery is finalized',
        reason: 'delivery_finalized'
      });
    }

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query('DELETE FROM deliveries WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    res.json({ 
      success: true, 
      message: 'Delivery deleted successfully'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to delete delivery', details: error.message });
  }
});

// PUT finalize delivery
app.put('/api/deliveries/:id/finalize', async (req, res) => {
  try {
    const { id } = req.params;
    const { finalized_by } = req.body;

    const now = new Date().toISOString();

    // Check if delivery exists, is not already finalized, and if tender is finalized
    const checkResult = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`
        SELECT d.is_finalized, t.is_finalized as tender_is_finalized
        FROM deliveries d
        LEFT JOIN tenders t ON d.tender_id = t.id
        WHERE d.id = @id
      `);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    const { is_finalized, tender_is_finalized } = checkResult.recordset[0];

    if (tender_is_finalized) {
      return res.status(400).json({ 
        error: 'Cannot finalize delivery - tender is already finalized',
        reason: 'tender_finalized'
      });
    }

    if (is_finalized) {
      return res.status(400).json({ error: 'Delivery is already finalized' });
    }

    // Update delivery to finalized status
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('finalized_by', sql.UniqueIdentifier, finalized_by)
      .input('finalized_at', sql.DateTime2, now)
      .input('updated_at', sql.DateTime2, now)
      .query(`
        UPDATE deliveries SET
          is_finalized = 1,
          finalized_by = @finalized_by,
          finalized_at = @finalized_at,
          updated_at = @updated_at
        WHERE id = @id
      `);
    res.json({ 
      success: true, 
      id: id,
      message: 'Delivery finalized successfully',
      finalized_at: now,
      finalized_by: finalized_by
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to finalize delivery', details: error.message });
  }
});

// =============================================================================
// STOCK TRANSACTION / INVENTORY ENDPOINTS
// =============================================================================

// GET all current inventory stock
app.get('/api/inventory-stock', async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT 
        cis.*,
        im.nomenclature as item_name,
        im.item_code,
        im.unit,
        im.category_id,
        im.specifications
      FROM current_inventory_stock cis
      LEFT JOIN item_masters im ON cis.item_master_id = im.id
      ORDER BY cis.last_updated DESC
    `);
    res.json(result.recordset);

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory stock', details: error.message });
  }
});

// GET single inventory stock by ID
app.get('/api/inventory-stock/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`
        SELECT 
          cis.*,
          im.nomenclature as item_name,
          im.item_code,
          im.unit,
          im.category_id,
          im.specifications
        FROM current_inventory_stock cis
        LEFT JOIN item_masters im ON cis.item_master_id = im.id
        WHERE cis.id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Inventory stock record not found' });
    }
    res.json(result.recordset[0]);

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory stock', details: error.message });
  }
});

// POST create new inventory stock record
app.post('/api/inventory-stock', async (req, res) => {
  try {
    const {
      item_master_id,
      current_quantity,
      reserved_quantity,
      available_quantity,
      minimum_stock_level,
      reorder_point,
      maximum_stock_level,
      updated_by
    } = req.body;

    const stockId = uuidv4();
    const now = new Date().toISOString();

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, stockId)
      .input('item_master_id', sql.UniqueIdentifier, item_master_id)
      .input('current_quantity', sql.Int, current_quantity)
      .input('reserved_quantity', sql.Int, reserved_quantity || 0)
      .input('available_quantity', sql.Int, available_quantity || current_quantity)
      .input('minimum_stock_level', sql.Int, minimum_stock_level || 0)
      .input('reorder_point', sql.Int, reorder_point || 0)
      .input('maximum_stock_level', sql.Int, maximum_stock_level || 0)
      .input('updated_by', sql.NVarChar, updated_by)
      .input('last_updated', sql.DateTime2, now)
      .input('created_at', sql.DateTime2, now)
      .query(`
        INSERT INTO current_inventory_stock (
          id, item_master_id, current_quantity, reserved_quantity, available_quantity,
          minimum_stock_level, reorder_point, maximum_stock_level, updated_by,
          last_updated, created_at
        ) VALUES (
          @id, @item_master_id, @current_quantity, @reserved_quantity, @available_quantity,
          @minimum_stock_level, @reorder_point, @maximum_stock_level, @updated_by,
          @last_updated, @created_at
        )
      `);
    res.json({ 
      success: true, 
      id: stockId,
      item_master_id: item_master_id,
      message: 'Inventory stock record created successfully'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to create inventory stock record', details: error.message });
  }
});

// PUT update inventory stock (stock transaction)
app.put('/api/inventory-stock/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      current_quantity,
      reserved_quantity,
      available_quantity,
      minimum_stock_level,
      reorder_point,
      maximum_stock_level,
      updated_by
    } = req.body;

    const now = new Date().toISOString();

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('current_quantity', sql.Int, current_quantity)
      .input('reserved_quantity', sql.Int, reserved_quantity)
      .input('available_quantity', sql.Int, available_quantity)
      .input('minimum_stock_level', sql.Int, minimum_stock_level)
      .input('reorder_point', sql.Int, reorder_point)
      .input('maximum_stock_level', sql.Int, maximum_stock_level)
      .input('updated_by', sql.NVarChar, updated_by)
      .input('last_updated', sql.DateTime2, now)
      .query(`
        UPDATE current_inventory_stock SET
          current_quantity = @current_quantity,
          reserved_quantity = @reserved_quantity,
          available_quantity = @available_quantity,
          minimum_stock_level = @minimum_stock_level,
          reorder_point = @reorder_point,
          maximum_stock_level = @maximum_stock_level,
          updated_by = @updated_by,
          last_updated = @last_updated
        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Inventory stock record not found' });
    }
    res.json({ 
      success: true, 
      id: id,
      message: 'Inventory stock updated successfully'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to update inventory stock', details: error.message });
  }
});

// DELETE inventory stock record
app.delete('/api/inventory-stock/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query('DELETE FROM current_inventory_stock WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Inventory stock record not found' });
    }
    res.json({ 
      success: true, 
      message: 'Inventory stock record deleted successfully'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to delete inventory stock record', details: error.message });
  }
});

// POST stock transaction (adjust stock levels)
app.post('/api/inventory-stock/:id/transaction', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      transaction_type, // 'IN', 'OUT', 'ADJUST'
      quantity,
      reason,
      updated_by
    } = req.body;

    const now = new Date().toISOString();

    // Get current stock levels
    const currentStock = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query('SELECT * FROM current_inventory_stock WHERE id = @id');

    if (currentStock.recordset.length === 0) {
      return res.status(404).json({ error: 'Inventory stock record not found' });
    }

    const stock = currentStock.recordset[0];
    let newCurrentQuantity = stock.current_quantity;
    let newAvailableQuantity = stock.available_quantity;

    // Calculate new quantities based on transaction type
    switch (transaction_type.toUpperCase()) {
      case 'IN':
        newCurrentQuantity += quantity;
        newAvailableQuantity += quantity;
        break;
      case 'OUT':
        newCurrentQuantity -= quantity;
        newAvailableQuantity -= quantity;
        break;
      case 'ADJUST':
        newCurrentQuantity = quantity;
        newAvailableQuantity = quantity - stock.reserved_quantity;
        break;
      default:
        return res.status(400).json({ error: 'Invalid transaction type. Use IN, OUT, or ADJUST' });
    }

    // Ensure quantities don't go negative
    if (newCurrentQuantity < 0) newCurrentQuantity = 0;
    if (newAvailableQuantity < 0) newAvailableQuantity = 0;

    // Update the stock record
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('current_quantity', sql.Int, newCurrentQuantity)
      .input('available_quantity', sql.Int, newAvailableQuantity)
      .input('updated_by', sql.NVarChar, updated_by)
      .input('last_updated', sql.DateTime2, now)
      .query(`
        UPDATE current_inventory_stock SET
          current_quantity = @current_quantity,
          available_quantity = @available_quantity,
          updated_by = @updated_by,
          last_updated = @last_updated
        WHERE id = @id
      `);
    res.json({ 
      success: true, 
      transaction_type: transaction_type,
      quantity: quantity,
      previous_quantity: stock.current_quantity,
      new_quantity: newCurrentQuantity,
      message: `Stock ${transaction_type.toLowerCase()} transaction completed successfully`
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to process stock transaction', details: error.message });
  }
});

// =============================================================================
// ITEM MASTER ENDPOINTS
// =============================================================================

// GET all item masters
app.get('/api/item-masters', async (req, res) => {
  try {
    if (!pool) {
      // Return mock data when SQL Server is not connected
      const mockItemMasters = [
        { id: '1', nomenclature: 'Desktop Computer', item_code: 'IT001', unit: 'Unit', category_id: '1', specifications: 'Intel i5, 8GB RAM, 500GB HDD' },
        { id: '2', nomenclature: 'Office Chair', item_code: 'FUR001', unit: 'Unit', category_id: '2', specifications: 'Ergonomic design, adjustable height' },
        { id: '3', nomenclature: 'A4 Paper', item_code: 'STA001', unit: 'Ream', category_id: '3', specifications: '80GSM, white, 500 sheets' }
      ];
      return res.json(mockItemMasters);
    }

    const result = await pool.request().query(`
      SELECT 
        id,
        nomenclature,
        item_code,
        unit,
        category_id,
        sub_category_id,
        specifications,
        description,
        minimum_stock_level,
        reorder_point,
        maximum_stock_level,
        status,
        created_at,
        updated_at
      FROM item_masters 
      WHERE status != 'Deleted'
      ORDER BY nomenclature
    `);
    res.json(result.recordset);
  } catch (error) {
    // Fallback to mock data on any error
    const mockItemMasters = [
      { id: '1', nomenclature: 'Desktop Computer', item_code: 'IT001', unit: 'Unit', category_id: '1', specifications: 'Intel i5, 8GB RAM, 500GB HDD' },
      { id: '2', nomenclature: 'Office Chair', item_code: 'FUR001', unit: 'Unit', category_id: '2', specifications: 'Ergonomic design, adjustable height' },
      { id: '3', nomenclature: 'A4 Paper', item_code: 'STA001', unit: 'Ream', category_id: '3', specifications: '80GSM, white, 500 sheets' }
    ];
    res.json(mockItemMasters);
  }
});

// GET single item master by ID
app.get('/api/item-masters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`
        SELECT 
          id,
          nomenclature,
          item_code,
          unit,
          category_id,
          sub_category_id,
          specifications,
          description,
          minimum_stock_level,
          reorder_point,
          maximum_stock_level,
          status,
          created_at,
          updated_at
        FROM item_masters 
        WHERE id = @id AND status != 'Deleted'
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Item master not found' });
    }
    res.json(result.recordset[0]);

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch item master', details: error.message });
  }
});

// POST create new item master
app.post('/api/item-masters', async (req, res) => {
  try {
    const {
      nomenclature,
      item_code,
      unit,
      category_id,
      sub_category_id,
      specifications,
      description,
      minimum_stock_level,
      reorder_point,
      maximum_stock_level,
      status = 'Active'
    } = req.body;

    const itemId = uuidv4();
    const now = new Date().toISOString();

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, itemId)
      .input('nomenclature', sql.NVarChar, nomenclature)
      .input('item_code', sql.NVarChar, item_code)
      .input('unit', sql.NVarChar, unit)
      .input('category_id', sql.UniqueIdentifier, category_id)
      .input('sub_category_id', sql.UniqueIdentifier, sub_category_id)
      .input('specifications', sql.NVarChar, specifications)
      .input('description', sql.NVarChar, description)
      .input('minimum_stock_level', sql.Int, minimum_stock_level || 0)
      .input('reorder_point', sql.Int, reorder_point || 0)
      .input('maximum_stock_level', sql.Int, maximum_stock_level || 0)
      .input('status', sql.NVarChar, status)
      .input('created_at', sql.DateTime2, now)
      .input('updated_at', sql.DateTime2, now)
      .query(`
        INSERT INTO item_masters (
          id, nomenclature, item_code, unit, category_id, sub_category_id,
          specifications, description, minimum_stock_level, reorder_point,
          maximum_stock_level, status, created_at, updated_at
        ) VALUES (
          @id, @nomenclature, @item_code, @unit, @category_id, @sub_category_id,
          @specifications, @description, @minimum_stock_level, @reorder_point,
          @maximum_stock_level, @status, @created_at, @updated_at
        )
      `);
    res.json({ 
      success: true, 
      id: itemId, 
      nomenclature: nomenclature,
      item_code: item_code,
      message: 'Item master created successfully'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to create item master', details: error.message });
  }
});

// PUT update item master
app.put('/api/item-masters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nomenclature,
      item_code,
      unit,
      category_id,
      sub_category_id,
      specifications,
      description,
      minimum_stock_level,
      reorder_point,
      maximum_stock_level,
      status
    } = req.body;

    const now = new Date().toISOString();

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('nomenclature', sql.NVarChar, nomenclature)
      .input('item_code', sql.NVarChar, item_code)
      .input('unit', sql.NVarChar, unit)
      .input('category_id', sql.UniqueIdentifier, category_id)
      .input('sub_category_id', sql.UniqueIdentifier, sub_category_id)
      .input('specifications', sql.NVarChar, specifications)
      .input('description', sql.NVarChar, description)
      .input('minimum_stock_level', sql.Int, minimum_stock_level)
      .input('reorder_point', sql.Int, reorder_point)
      .input('maximum_stock_level', sql.Int, maximum_stock_level)
      .input('status', sql.NVarChar, status)
      .input('updated_at', sql.DateTime2, now)
      .query(`
        UPDATE item_masters SET
          nomenclature = @nomenclature,
          item_code = @item_code,
          unit = @unit,
          category_id = @category_id,
          sub_category_id = @sub_category_id,
          specifications = @specifications,
          description = @description,
          minimum_stock_level = @minimum_stock_level,
          reorder_point = @reorder_point,
          maximum_stock_level = @maximum_stock_level,
          status = @status,
          updated_at = @updated_at
        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Item master not found' });
    }
    res.json({ 
      success: true, 
      id: id,
      message: 'Item master updated successfully'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to update item master', details: error.message });
  }
});

// DELETE item master (soft delete)
app.delete('/api/item-masters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date().toISOString();

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('updated_at', sql.DateTime2, now)
      .query(`
        UPDATE item_masters SET
          status = 'Deleted',
          updated_at = @updated_at
        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Item master not found' });
    }
    res.json({ 
      success: true, 
      message: 'Item master deleted successfully'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item master', details: error.message });
  }
});

// =============================================================================
// VENDOR ENDPOINTS
// =============================================================================

// GET all vendors
app.get('/api/vendors', async (req, res) => {
  try {
    if (!pool) {
      // Return mock data when SQL Server is not connected
      const mockVendors = [
        { id: '1', vendor_code: 'VEN001', vendor_name: 'ABC Suppliers Ltd', contact_person: 'John Smith', email: 'john@abc.com', phone: '021-1234567', status: 'Active' },
        { id: '2', vendor_code: 'VEN002', vendor_name: 'XYZ Traders', contact_person: 'Jane Doe', email: 'jane@xyz.com', phone: '021-7654321', status: 'Active' },
        { id: '3', vendor_code: 'VEN003', vendor_name: 'Best Quality Co', contact_person: 'Mike Johnson', email: 'mike@bestquality.com', phone: '042-1111111', status: 'Active' }
      ];
      return res.json({ vendors: mockVendors });
    }

    const result = await pool.request().query(`
      SELECT 
        id,
        vendor_code,
        vendor_name,
        contact_person,
        email,
        phone,
        address,
        city,
        country,
        tax_number,
        status,
        created_at,
        updated_at
      FROM vendors 
      WHERE status != 'Deleted'
      ORDER BY vendor_name
    `);
    res.json({ vendors: result.recordset });
  } catch (error) {
    // Fallback to mock data on any error
    const mockVendors = [
      { id: '1', vendor_code: 'VEN001', vendor_name: 'ABC Suppliers Ltd', contact_person: 'John Smith', email: 'john@abc.com', phone: '021-1234567', status: 'Active' },
      { id: '2', vendor_code: 'VEN002', vendor_name: 'XYZ Traders', contact_person: 'Jane Doe', email: 'jane@xyz.com', phone: '021-7654321', status: 'Active' },
      { id: '3', vendor_code: 'VEN003', vendor_name: 'Best Quality Co', contact_person: 'Mike Johnson', email: 'mike@bestquality.com', phone: '042-1111111', status: 'Active' }
    ];
    res.json({ vendors: mockVendors });
  }
});

// GET single vendor by ID
app.get('/api/vendors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`
        SELECT 
          id,
          vendor_code,
          vendor_name,
          contact_person,
          email,
          phone,
          address,
          city,
          country,
          tax_number,
          status,
          created_at,
          updated_at
        FROM vendors 
        WHERE id = @id AND status != 'Deleted'
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    res.json(result.recordset[0]);

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vendor', details: error.message });
  }
});

// POST create new vendor
app.post('/api/vendors', async (req, res) => {
  try {
    const {
      vendor_code,
      vendor_name,
      contact_person,
      email,
      phone,
      address,
      city,
      country,
      tax_number,
      status = 'Active'
    } = req.body;

    const vendorId = uuidv4();
    const now = new Date().toISOString();

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, vendorId)
      .input('vendor_code', sql.NVarChar, vendor_code)
      .input('vendor_name', sql.NVarChar, vendor_name)
      .input('contact_person', sql.NVarChar, contact_person)
      .input('email', sql.NVarChar, email)
      .input('phone', sql.NVarChar, phone)
      .input('address', sql.NVarChar, address)
      .input('city', sql.NVarChar, city)
      .input('country', sql.NVarChar, country)
      .input('tax_number', sql.NVarChar, tax_number)
      .input('status', sql.NVarChar, status)
      .input('created_at', sql.DateTime2, now)
      .input('updated_at', sql.DateTime2, now)
      .query(`
        INSERT INTO vendors (
          id, vendor_code, vendor_name, contact_person, email, phone,
          address, city, country, tax_number, status, created_at, updated_at
        ) VALUES (
          @id, @vendor_code, @vendor_name, @contact_person, @email, @phone,
          @address, @city, @country, @tax_number, @status, @created_at, @updated_at
        )
      `);
    res.json({ 
      success: true, 
      id: vendorId, 
      vendor_code: vendor_code,
      vendor_name: vendor_name,
      message: 'Vendor created successfully'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to create vendor', details: error.message });
  }
});

// PUT update vendor
app.put('/api/vendors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      vendor_code,
      vendor_name,
      contact_person,
      email,
      phone,
      address,
      city,
      country,
      tax_number,
      status
    } = req.body;

    const now = new Date().toISOString();

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('vendor_code', sql.NVarChar, vendor_code)
      .input('vendor_name', sql.NVarChar, vendor_name)
      .input('contact_person', sql.NVarChar, contact_person)
      .input('email', sql.NVarChar, email)
      .input('phone', sql.NVarChar, phone)
      .input('address', sql.NVarChar, address)
      .input('city', sql.NVarChar, city)
      .input('country', sql.NVarChar, country)
      .input('tax_number', sql.NVarChar, tax_number)
      .input('status', sql.NVarChar, status)
      .input('updated_at', sql.DateTime2, now)
      .query(`
        UPDATE vendors SET
          vendor_code = @vendor_code,
          vendor_name = @vendor_name,
          contact_person = @contact_person,
          email = @email,
          phone = @phone,
          address = @address,
          city = @city,
          country = @country,
          tax_number = @tax_number,
          status = @status,
          updated_at = @updated_at
        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    res.json({ 
      success: true, 
      id: id,
      message: 'Vendor updated successfully'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to update vendor', details: error.message });
  }
});

// DELETE vendor (soft delete)
app.delete('/api/vendors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date().toISOString();

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('updated_at', sql.DateTime2, now)
      .query(`
        UPDATE vendors SET
          status = 'Deleted',
          updated_at = @updated_at
        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    res.json({ 
      success: true, 
      message: 'Vendor deleted successfully'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to delete vendor', details: error.message });
  }
});

// ==================== REORDER REQUESTS ENDPOINTS ====================

// Get all reorder requests or filter by status
app.get('/api/reorder-requests', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    let query = `
      SELECT 
        rr.*,
        im.nomenclature as item_name,
        im.unit,
        o.strOfficeName as office_name
      FROM reorder_requests rr
      LEFT JOIN item_masters im ON rr.item_master_id = im.id
      LEFT JOIN Office o ON rr.office_id = o.intOfficeID
      WHERE rr.boolDeleted = 0
    `;
    
    const request = pool.request();
    
    // Add status filter if provided
    if (req.query.status) {
      query += ` AND rr.status = @status`;
      request.input('status', sql.VarChar, req.query.status);
    }
    
    query += ` ORDER BY rr.created_at DESC`;
    
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reorder requests', details: error.message });
  }
});

// Get reorder request by ID
app.get('/api/reorder-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`
        SELECT 
          rr.*,
          im.nomenclature as item_name,
          im.unit,
          o.strOfficeName as office_name
        FROM reorder_requests rr
        LEFT JOIN item_masters im ON rr.item_master_id = im.id
        LEFT JOIN Office o ON rr.office_id = o.intOfficeID
        WHERE rr.id = @id AND rr.boolDeleted = 0
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Reorder request not found' });
    }
    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reorder request', details: error.message });
  }
});

// Create new reorder request
app.post('/api/reorder-requests', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const {
      item_master_id,
      office_id,
      current_stock,
      minimum_level,
      reorder_level,
      suggested_quantity,
      actual_quantity,
      priority,
      requested_by,
      remarks
    } = req.body;

    const id = uuidv4();
    const now = new Date().toISOString();

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('item_master_id', sql.UniqueIdentifier, item_master_id)
      .input('office_id', sql.Int, office_id)
      .input('current_stock', sql.Int, current_stock)
      .input('minimum_level', sql.Int, minimum_level)
      .input('reorder_level', sql.Int, reorder_level)
      .input('suggested_quantity', sql.Int, suggested_quantity)
      .input('actual_quantity', sql.Int, actual_quantity || null)
      .input('priority', sql.VarChar, priority || 'Medium')
      .input('status', sql.VarChar, 'Pending')
      .input('requested_by', sql.VarChar, requested_by)
      .input('requested_at', sql.DateTime, now)
      .input('remarks', sql.Text, remarks || null)
      .input('created_at', sql.DateTime, now)
      .input('updated_at', sql.DateTime, now)
      .input('boolActive', sql.Bit, true)
      .input('boolDeleted', sql.Bit, false)
      .query(`
        INSERT INTO reorder_requests (
          id, item_master_id, office_id, current_stock, minimum_level, 
          reorder_level, suggested_quantity, actual_quantity, priority, 
          status, requested_by, requested_at, remarks, created_at, 
          updated_at, boolActive, boolDeleted
        ) VALUES (
          @id, @item_master_id, @office_id, @current_stock, @minimum_level,
          @reorder_level, @suggested_quantity, @actual_quantity, @priority,
          @status, @requested_by, @requested_at, @remarks, @created_at,
          @updated_at, @boolActive, @boolDeleted
        );
        
        SELECT 
          rr.*,
          im.nomenclature as item_name,
          im.unit,
          o.strOfficeName as office_name
        FROM reorder_requests rr
        LEFT JOIN item_masters im ON rr.item_master_id = im.id
        LEFT JOIN Office o ON rr.office_id = o.intOfficeID
        WHERE rr.id = @id;
      `);
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create reorder request', details: error.message });
  }
});

// Update reorder request
app.put('/api/reorder-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const updateData = req.body;
    const now = new Date().toISOString();

    // Build dynamic update query
    const fields = [];
    const request = pool.request().input('id', sql.UniqueIdentifier, id);

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = @${key}`);
        
        if (key.includes('_at') || key.includes('Date')) {
          request.input(key, sql.DateTime, updateData[key]);
        } else if (typeof updateData[key] === 'number') {
          request.input(key, sql.Int, updateData[key]);
        } else if (typeof updateData[key] === 'boolean') {
          request.input(key, sql.Bit, updateData[key]);
        } else {
          request.input(key, sql.VarChar, updateData[key]);
        }
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    fields.push('updated_at = @updated_at');
    request.input('updated_at', sql.DateTime, now);

    const result = await request.query(`
      UPDATE reorder_requests 
      SET ${fields.join(', ')}
      WHERE id = @id AND boolDeleted = 0;
      
      SELECT 
        rr.*,
        im.nomenclature as item_name,
        im.unit,
        o.strOfficeName as office_name
      FROM reorder_requests rr
      LEFT JOIN item_masters im ON rr.item_master_id = im.id
      LEFT JOIN Office o ON rr.office_id = o.intOfficeID
      WHERE rr.id = @id;
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Reorder request not found' });
    }
    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update reorder request', details: error.message });
  }
});

// Delete reorder request
app.delete('/api/reorder-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const now = new Date().toISOString();

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('updated_at', sql.DateTime, now)
      .query(`
        UPDATE reorder_requests 
        SET boolDeleted = 1, updated_at = @updated_at
        WHERE id = @id AND boolDeleted = 0
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Reorder request not found' });
    }
    res.json({ message: 'Reorder request deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete reorder request', details: error.message });
  }
});

// ==================== STOCK TRANSACTIONS ENDPOINTS ====================

// Get all stock transactions with filters
app.get('/api/stock-transactions', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    let query = `
      SELECT 
        st.*,
        im.nomenclature as item_name,
        im.unit,
        o.strOfficeName as office_name,
        fo.strOfficeName as from_office_name,
        to_office.strOfficeName as to_office_name
      FROM stock_transactions st
      LEFT JOIN item_masters im ON st.item_master_id = im.id
      LEFT JOIN Office o ON st.office_id = o.intOfficeID
      LEFT JOIN Office fo ON st.from_office_id = fo.intOfficeID
      LEFT JOIN Office to_office ON st.to_office_id = to_office.intOfficeID
      WHERE st.boolDeleted = 0
    `;
    
    const request = pool.request();
    
    // Add filters
    if (req.query.officeId) {
      query += ` AND st.office_id = @officeId`;
      request.input('officeId', sql.Int, req.query.officeId);
    }
    
    if (req.query.itemMasterId) {
      query += ` AND st.item_master_id = @itemMasterId`;
      request.input('itemMasterId', sql.UniqueIdentifier, req.query.itemMasterId);
    }
    
    if (req.query.type) {
      query += ` AND st.transaction_type = @type`;
      request.input('type', sql.VarChar, req.query.type);
    }
    
    if (req.query.startDate) {
      query += ` AND st.transaction_date >= @startDate`;
      request.input('startDate', sql.DateTime, req.query.startDate);
    }
    
    if (req.query.endDate) {
      query += ` AND st.transaction_date <= @endDate`;
      request.input('endDate', sql.DateTime, req.query.endDate);
    }
    
    query += ` ORDER BY st.transaction_date DESC, st.created_at DESC`;
    
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stock transactions', details: error.message });
  }
});

// Get stock transaction by ID
app.get('/api/stock-transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`
        SELECT 
          st.*,
          im.nomenclature as item_name,
          im.unit,
          o.strOfficeName as office_name,
          fo.strOfficeName as from_office_name,
          to_office.strOfficeName as to_office_name
        FROM stock_transactions st
        LEFT JOIN item_masters im ON st.item_master_id = im.id
        LEFT JOIN Office o ON st.office_id = o.intOfficeID
        LEFT JOIN Office fo ON st.from_office_id = fo.intOfficeID
        LEFT JOIN Office to_office ON st.to_office_id = to_office.intOfficeID
        WHERE st.id = @id AND st.boolDeleted = 0
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Stock transaction not found' });
    }
    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stock transaction', details: error.message });
  }
});

// Create new stock transaction
app.post('/api/stock-transactions', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const {
      item_master_id,
      office_id,
      transaction_type,
      quantity,
      unit_price,
      total_value,
      reference_type,
      reference_id,
      reference_number,
      from_office_id,
      to_office_id,
      remarks,
      transaction_date,
      created_by
    } = req.body;

    const id = uuidv4();
    const now = new Date().toISOString();
    const transactionDate = transaction_date || now;

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('item_master_id', sql.UniqueIdentifier, item_master_id)
      .input('office_id', sql.Int, office_id)
      .input('transaction_type', sql.VarChar, transaction_type)
      .input('quantity', sql.Int, quantity)
      .input('unit_price', sql.Decimal(18, 2), unit_price || null)
      .input('total_value', sql.Decimal(18, 2), total_value || (unit_price && quantity ? unit_price * quantity : null))
      .input('reference_type', sql.VarChar, reference_type || null)
      .input('reference_id', sql.VarChar, reference_id || null)
      .input('reference_number', sql.VarChar, reference_number || null)
      .input('from_office_id', sql.Int, from_office_id || null)
      .input('to_office_id', sql.Int, to_office_id || null)
      .input('remarks', sql.Text, remarks || null)
      .input('transaction_date', sql.DateTime, transactionDate)
      .input('created_by', sql.VarChar, created_by)
      .input('created_at', sql.DateTime, now)
      .input('updated_at', sql.DateTime, now)
      .input('boolActive', sql.Bit, true)
      .input('boolDeleted', sql.Bit, false)
      .query(`
        INSERT INTO stock_transactions (
          id, item_master_id, office_id, transaction_type, quantity,
          unit_price, total_value, reference_type, reference_id, reference_number,
          from_office_id, to_office_id, remarks, transaction_date, created_by,
          created_at, updated_at, boolActive, boolDeleted
        ) VALUES (
          @id, @item_master_id, @office_id, @transaction_type, @quantity,
          @unit_price, @total_value, @reference_type, @reference_id, @reference_number,
          @from_office_id, @to_office_id, @remarks, @transaction_date, @created_by,
          @created_at, @updated_at, @boolActive, @boolDeleted
        );
        
        SELECT 
          st.*,
          im.nomenclature as item_name,
          im.unit,
          o.strOfficeName as office_name,
          fo.strOfficeName as from_office_name,
          to_office.strOfficeName as to_office_name
        FROM stock_transactions st
        LEFT JOIN item_masters im ON st.item_master_id = im.id
        LEFT JOIN Office o ON st.office_id = o.intOfficeID
        LEFT JOIN Office fo ON st.from_office_id = fo.intOfficeID
        LEFT JOIN Office to_office ON st.to_office_id = to_office.intOfficeID
        WHERE st.id = @id;
      `);
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create stock transaction', details: error.message });
  }
});

// Update stock transaction
app.put('/api/stock-transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const updateData = req.body;
    const now = new Date().toISOString();

    // Build dynamic update query
    const fields = [];
    const request = pool.request().input('id', sql.UniqueIdentifier, id);

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = @${key}`);
        
        if (key.includes('_at') || key.includes('Date') || key.includes('_date')) {
          request.input(key, sql.DateTime, updateData[key]);
        } else if (key.includes('price') || key.includes('value')) {
          request.input(key, sql.Decimal(18, 2), updateData[key]);
        } else if (typeof updateData[key] === 'number') {
          request.input(key, sql.Int, updateData[key]);
        } else if (typeof updateData[key] === 'boolean') {
          request.input(key, sql.Bit, updateData[key]);
        } else {
          request.input(key, sql.VarChar, updateData[key]);
        }
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    fields.push('updated_at = @updated_at');
    request.input('updated_at', sql.DateTime, now);

    const result = await request.query(`
      UPDATE stock_transactions 
      SET ${fields.join(', ')}
      WHERE id = @id AND boolDeleted = 0;
      
      SELECT 
        st.*,
        im.nomenclature as item_name,
        im.unit,
        o.strOfficeName as office_name,
        fo.strOfficeName as from_office_name,
        to_office.strOfficeName as to_office_name
      FROM stock_transactions st
      LEFT JOIN item_masters im ON st.item_master_id = im.id
      LEFT JOIN Office o ON st.office_id = o.intOfficeID
      LEFT JOIN Office fo ON st.from_office_id = fo.intOfficeID
      LEFT JOIN Office to_office ON st.to_office_id = to_office.intOfficeID
      WHERE st.id = @id;
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Stock transaction not found' });
    }
    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stock transaction', details: error.message });
  }
});

// Delete stock transaction
app.delete('/api/stock-transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const now = new Date().toISOString();

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('updated_at', sql.DateTime, now)
      .query(`
        UPDATE stock_transactions 
        SET boolDeleted = 1, updated_at = @updated_at
        WHERE id = @id AND boolDeleted = 0
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Stock transaction not found' });
    }
    res.json({ message: 'Stock transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete stock transaction', details: error.message });
  }
});

// ==================== STORES ENDPOINTS ====================

// Get all stores
app.get('/api/stores', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const result = await pool.request().query(`
      SELECT 
        id,
        store_name,
        description,
        address,
        office_id,
        boolActive as active,
        created_at,
        updated_at
      FROM stores 
      WHERE boolDeleted = 0
      ORDER BY store_name
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stores', details: error.message });
  }
});

// Get store by ID
app.get('/api/stores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`
        SELECT 
          id,
          store_name,
          description,
          address,
          office_id,
          boolActive as active,
          created_at,
          updated_at
        FROM stores 
        WHERE id = @id AND boolDeleted = 0
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }
    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch store', details: error.message });
  }
});

// Create new store
app.post('/api/stores', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const { store_name, description, address, office_id } = req.body;

    if (!store_name) {
      return res.status(400).json({ error: 'Store name is required' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('store_name', sql.VarChar, store_name)
      .input('description', sql.Text, description || null)
      .input('address', sql.Text, address || null)
      .input('office_id', sql.Int, office_id || null)
      .input('created_at', sql.DateTime, now)
      .input('updated_at', sql.DateTime, now)
      .input('boolActive', sql.Bit, true)
      .input('boolDeleted', sql.Bit, false)
      .query(`
        INSERT INTO stores (
          id, store_name, description, address, office_id,
          created_at, updated_at, boolActive, boolDeleted
        ) VALUES (
          @id, @store_name, @description, @address, @office_id,
          @created_at, @updated_at, @boolActive, @boolDeleted
        );
        
        SELECT 
          id,
          store_name,
          description,
          address,
          office_id,
          boolActive as active,
          created_at,
          updated_at
        FROM stores 
        WHERE id = @id;
      `);
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create store', details: error.message });
  }
});

// Update store
app.put('/api/stores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const updateData = req.body;
    const now = new Date().toISOString();

    // Build dynamic update query
    const fields = [];
    const request = pool.request().input('id', sql.UniqueIdentifier, id);

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = @${key}`);
        
        if (key.includes('_at') || key.includes('Date')) {
          request.input(key, sql.DateTime, updateData[key]);
        } else if (typeof updateData[key] === 'number') {
          request.input(key, sql.Int, updateData[key]);
        } else if (typeof updateData[key] === 'boolean') {
          request.input(key, sql.Bit, updateData[key]);
        } else {
          request.input(key, sql.VarChar, updateData[key]);
        }
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    fields.push('updated_at = @updated_at');
    request.input('updated_at', sql.DateTime, now);

    const result = await request.query(`
      UPDATE stores 
      SET ${fields.join(', ')}
      WHERE id = @id AND boolDeleted = 0;
      
      SELECT 
        id,
        store_name,
        description,
        address,
        office_id,
        boolActive as active,
        created_at,
        updated_at
      FROM stores 
      WHERE id = @id;
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }
    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update store', details: error.message });
  }
});

// Delete store
app.delete('/api/stores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const now = new Date().toISOString();

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('updated_at', sql.DateTime, now)
      .query(`
        UPDATE stores 
        SET boolDeleted = 1, updated_at = @updated_at
        WHERE id = @id AND boolDeleted = 0
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }
    res.json({ message: 'Store deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete store', details: error.message });
  }
});

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database connection initialized');
    
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Database: ${sqlConfig.database} on ${sqlConfig.server}`);
      console.log(`📁 Upload directory: ${uploadsDir}`);
      console.log('🚀 Tender form with complete field mapping ready!');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// ===== ITEM SERIAL NUMBERS ENDPOINTS =====

// GET all serial numbers by tender item ID
app.get('/api/item-serial-numbers/tender-item/:tenderItemId', async (req, res) => {
  try {
    const { tenderItemId } = req.params;

    const result = await pool.request()
      .input('tender_item_id', sql.UniqueIdentifier, tenderItemId)
      .query(`
        SELECT 
          id,
          tender_item_id,
          serial_number,
          status,
          remarks,
          created_at
        FROM item_serial_numbers 
        WHERE tender_item_id = @tender_item_id
        ORDER BY created_at DESC
      `);
    res.json(result.recordset);

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch serial numbers', details: error.message });
  }
});

// POST create single serial number
app.post('/api/item-serial-numbers', async (req, res) => {
  try {
    const {
      tender_item_id,
      serial_number,
      status,
      remarks
    } = req.body;

    const id = require('crypto').randomUUID();
    const now = new Date().toISOString();

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('tender_item_id', sql.UniqueIdentifier, tender_item_id)
      .input('serial_number', sql.NVarChar, serial_number)
      .input('status', sql.NVarChar, status || null)
      .input('remarks', sql.NVarChar, remarks || null)
      .input('created_at', sql.DateTime2, now)
      .query(`
        INSERT INTO item_serial_numbers (
          id, tender_item_id, serial_number, status, remarks, created_at
        ) VALUES (
          @id, @tender_item_id, @serial_number, @status, @remarks, @created_at
        )
      `);
    res.json({ 
      success: true, 
      id: id,
      message: 'Serial number created successfully'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to create serial number', details: error.message });
  }
});

// POST create multiple serial numbers
app.post('/api/item-serial-numbers/bulk', async (req, res) => {
  try {
    const { serials } = req.body;

    if (!Array.isArray(serials) || serials.length === 0) {
      return res.status(400).json({ error: 'Serials array is required and cannot be empty' });
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const insertedIds = [];

      for (const serial of serials) {
        const id = require('crypto').randomUUID();
        const now = new Date().toISOString();

        await transaction.request()
          .input('id', sql.UniqueIdentifier, id)
          .input('tender_item_id', sql.UniqueIdentifier, serial.tender_item_id)
          .input('serial_number', sql.NVarChar, serial.serial_number)
          .input('status', sql.NVarChar, serial.status || null)
          .input('remarks', sql.NVarChar, serial.remarks || null)
          .input('created_at', sql.DateTime2, now)
          .query(`
            INSERT INTO item_serial_numbers (
              id, tender_item_id, serial_number, status, remarks, created_at
            ) VALUES (
              @id, @tender_item_id, @serial_number, @status, @remarks, @created_at
            )
          `);

        insertedIds.push(id);
      }

      await transaction.commit();
      res.json({ 
        success: true, 
        ids: insertedIds,
        count: serials.length,
        message: 'Serial numbers created successfully'
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    res.status(500).json({ error: 'Failed to create serial numbers', details: error.message });
  }
});

// PUT update serial number
app.put('/api/item-serial-numbers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      serial_number,
      status,
      remarks
    } = req.body;

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('serial_number', sql.NVarChar, serial_number)
      .input('status', sql.NVarChar, status)
      .input('remarks', sql.NVarChar, remarks)
      .query(`
        UPDATE item_serial_numbers SET
          serial_number = @serial_number,
          status = @status,
          remarks = @remarks
        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Serial number not found' });
    }
    res.json({ 
      success: true, 
      id: id,
      message: 'Serial number updated successfully'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to update serial number', details: error.message });
  }
});

// DELETE serial number by ID
app.delete('/api/item-serial-numbers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query('DELETE FROM item_serial_numbers WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Serial number not found' });
    }
    res.json({ 
      success: true, 
      message: 'Serial number deleted successfully'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to delete serial number', details: error.message });
  }
});

// DELETE all serial numbers by tender item ID
app.delete('/api/item-serial-numbers/tender-item/:tenderItemId', async (req, res) => {
  try {
    const { tenderItemId } = req.params;

    const result = await pool.request()
      .input('tender_item_id', sql.UniqueIdentifier, tenderItemId)
      .query('DELETE FROM item_serial_numbers WHERE tender_item_id = @tender_item_id');
    res.json({ 
      success: true, 
      deletedCount: result.rowsAffected[0],
      message: 'Serial numbers deleted successfully'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to delete serial numbers', details: error.message });
  }
});

// Get stock transaction dashboard statistics
app.get('/api/stock-transaction-dashboard-stats', async (req, res) => {
  try {
    // Get ALL tenders from tenders table with stock transaction status using View_stock_transactions_clean
    const allTendersQuery = `
      SELECT 
        t.id,
        t.reference_number as tenderNumber,
        t.title,
        t.description,
        t.is_finalized,
        t.status,
        t.tender_spot_type,
        t.created_at,
        t.updated_at,
        COALESCE(stockCounts.itemCount, 0) as itemCount,
        COALESCE(stockCounts.totalQuantity, 0) as totalQuantity,
        COALESCE(stockCounts.confirmedItems, 0) as confirmedItems,
        CASE 
          WHEN stockCounts.itemCount > 0 THEN 1 
          ELSE 0 
        END as hasStockTransactions
      FROM tenders t
      LEFT JOIN (
        SELECT 
          tender_id,
          COUNT(item_master_id) as itemCount,
          SUM(total_quantity_received) as totalQuantity,
          COUNT(CASE WHEN pricing_confirmed = 1 THEN 1 END) as confirmedItems
        FROM View_stock_transactions_clean 
        WHERE (is_deleted = 0 OR is_deleted IS NULL)
        GROUP BY tender_id
      ) stockCounts ON t.id = stockCounts.tender_id
      ORDER BY 
        CASE WHEN stockCounts.itemCount > 0 THEN 0 ELSE 1 END, -- Show tenders with stock transactions first
        t.updated_at DESC
    `;

    const allTendersResult = await pool.request().query(allTendersQuery);
    const allTenders = allTendersResult.recordset;

    // Separate tenders with and without stock transactions
    const tendersWithStockTransactions = allTenders.filter(t => t.hasStockTransactions === 1);
    const tendersWithoutStockTransactions = allTenders.filter(t => t.hasStockTransactions === 0);

    // Calculate stats from tenders WITH stock transactions
    const totalTendersWithStock = tendersWithStockTransactions.length;
    const totalItems = tendersWithStockTransactions.reduce((sum, t) => sum + (parseInt(t.itemCount) || 0), 0);
    const totalQuantity = tendersWithStockTransactions.reduce((sum, t) => sum + (parseInt(t.totalQuantity) || 0), 0);

    // Calculate active vs finalized based on stock transaction status
    const activeTenders = tendersWithStockTransactions.filter(t => !t.is_finalized || t.confirmedItems < t.itemCount).length;
    const finalizedTenders = tendersWithStockTransactions.filter(t => t.is_finalized && t.confirmedItems === t.itemCount).length;

    // Get acquisition type breakdown from ALL tenders
    const acquisitionStats = allTenders.reduce((acc, tender) => {
      const type = tender.tender_spot_type || 'Contract/Tender';
      if (!acc[type]) {
        acc[type] = { count: 0, items: 0, quantity: 0 };
      }
      acc[type].count++;
      if (tender.hasStockTransactions === 1) {
        acc[type].items += parseInt(tender.itemCount) || 0;
        acc[type].quantity += parseInt(tender.totalQuantity) || 0;
      }
      return acc;
    }, {});

    // Combine tenders for display: active with stock transactions first, then those without
    const recentTenders = [
      ...tendersWithStockTransactions.slice(0, 5), // First 5 with stock transactions
      ...tendersWithoutStockTransactions.slice(0, 5) // Then up to 5 without stock transactions
    ];
    
    const stats = {
      totalTenders: allTenders.length, // All tenders count
      tendersWithStockTransactions: totalTendersWithStock,
      tendersWithoutStockTransactions: tendersWithoutStockTransactions.length,
      activeTenders: activeTenders,
      finalizedTenders: finalizedTenders,
      totalItems: totalItems,
      totalQuantity: totalQuantity,
      acquisitionStats: {
        'Contract/Tender': acquisitionStats['Contract/Tender'] || { count: 0, items: 0, quantity: 0 },
        'Spot Purchase': acquisitionStats['Spot Purchase'] || { count: 0, items: 0, quantity: 0 }
      },
      // Separate arrays for the two different tables
      tendersWithStock: tendersWithStockTransactions.map(tender => ({
        id: tender.id,
        title: tender.title || `Tender ${tender.tenderNumber}`,
        tenderNumber: tender.tenderNumber,
        acquisitionType: tender.tender_spot_type || 'Contract/Tender',
        is_finalized: tender.is_finalized && tender.confirmedItems === tender.itemCount,
        createdAt: tender.created_at,
        itemCount: tender.itemCount,
        totalQuantity: tender.totalQuantity,
        hasStockTransactions: true,
        status: tender.status
      })),
      tendersAwaitingStock: tendersWithoutStockTransactions.map(tender => ({
        id: tender.id,
        title: tender.title || `Tender ${tender.tenderNumber}`,
        tenderNumber: tender.tenderNumber,
        acquisitionType: tender.tender_spot_type || 'Contract/Tender',
        is_finalized: tender.is_finalized,
        createdAt: tender.created_at,
        itemCount: 0,
        totalQuantity: 0,
        hasStockTransactions: false,
        status: tender.status
      })),
      // Keep backwards compatibility
      recentTenders: recentTenders.map(tender => ({
        id: tender.id,
        title: tender.title || `Tender ${tender.tenderNumber}`,
        tenderNumber: tender.tenderNumber,
        acquisitionType: tender.tender_spot_type || 'Contract/Tender',
        is_finalized: tender.is_finalized && tender.confirmedItems === tender.itemCount,
        createdAt: tender.created_at,
        itemCount: tender.itemCount,
        totalQuantity: tender.totalQuantity,
        hasStockTransactions: tender.hasStockTransactions === 1,
        status: tender.status
      }))
    };
    res.json(stats);
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch dashboard statistics', 
      details: error.message,
      totalTenders: 0,
      activeTenders: 0,
      finalizedTenders: 0,
      totalItems: 0,
      totalQuantity: 0,
      recentTenders: []
    });
  }
});

// Get stock transactions by tender_id from stock_transactions_clean
app.get('/api/stock-transactions-clean', async (req, res) => {
  try {
    const { tender_id } = req.query;
    
    let query = `
      SELECT 
        stc.id,
        stc.tender_id,
        stc.item_master_id,
        stc.estimated_unit_price,
        stc.actual_unit_price,
        stc.total_quantity_received,
        stc.type,
        stc.remarks,
        stc.pricing_confirmed,
        stc.created_at,
        stc.updated_at,
        stc.is_deleted,
        stc.deleted_at,
        stc.deleted_by,
        COALESCE(im.nomenclature, 'Unknown Item') as nomenclature,
        COALESCE(im.specifications, '') as specifications,
        COALESCE(im.unit, '') as unit
      FROM stock_transactions_clean stc
      LEFT JOIN item_masters im ON stc.item_master_id = CAST(im.id AS VARCHAR(50))
      WHERE (stc.is_deleted = 0 OR stc.is_deleted IS NULL)
    `;
    
    const request = pool.request();
    
    if (tender_id) {
      query += ` AND stc.tender_id = @tender_id`;
      request.input('tender_id', sql.UniqueIdentifier, tender_id);
    }
    
    query += ` ORDER BY stc.created_at DESC`;
    
    const result = await request.query(query);
    
    res.json(result.recordset);
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stock transactions', details: error.message });
  }
});

// Create new stock transaction in stock_transactions_clean
app.post('/api/stock-transactions-clean', async (req, res) => {
  try {
    const {
      tender_id,
      item_master_id,
      estimated_unit_price = 0,
      actual_unit_price = 0,
      total_quantity_received = 0,
      pricing_confirmed = false,
      type = 'IN',
      remarks
    } = req.body;
    const query = `
      INSERT INTO stock_transactions_clean (
        id,
        tender_id,
        item_master_id,
        estimated_unit_price,
        actual_unit_price,
        total_quantity_received,
        pricing_confirmed,
        type,
        remarks,
        is_deleted,
        created_at,
        updated_at
      )
      OUTPUT INSERTED.*
      VALUES (
        NEWID(),
        @tender_id,
        @item_master_id,
        @estimated_unit_price,
        @actual_unit_price,
        @total_quantity_received,
        @pricing_confirmed,
        @type,
        @remarks,
        0,
        GETDATE(),
        GETDATE()
      )
    `;

    const result = await pool.request()
      .input('tender_id', sql.UniqueIdentifier, tender_id)
      .input('item_master_id', sql.VarChar(50), item_master_id)
      .input('estimated_unit_price', sql.Decimal(18, 2), estimated_unit_price)
      .input('actual_unit_price', sql.Decimal(18, 2), actual_unit_price)
      .input('total_quantity_received', sql.Int, total_quantity_received)
      .input('pricing_confirmed', sql.Bit, pricing_confirmed)
      .input('type', sql.VarChar(10), type)
      .input('remarks', sql.Text, remarks)
      .query(query);
    res.status(201).json(result.recordset[0]);

  } catch (error) {
    res.status(500).json({ error: 'Failed to create stock transaction', details: error.message });
  }
});

// Update stock transaction in stock_transactions_clean
app.put('/api/stock-transactions-clean/:tender_id/:item_master_id', async (req, res) => {
  try {
    const { tender_id, item_master_id } = req.params;
    const updates = req.body;
    // Build dynamic update query
    const setClause = [];
    const request = pool.request();
    
    request.input('tender_id', sql.UniqueIdentifier, tender_id);
    request.input('item_master_id', sql.VarChar(50), item_master_id);

    if (updates.estimated_unit_price !== undefined) {
      setClause.push('estimated_unit_price = @estimated_unit_price');
      request.input('estimated_unit_price', sql.Decimal(18, 2), updates.estimated_unit_price);
    }

    if (updates.actual_unit_price !== undefined) {
      setClause.push('actual_unit_price = @actual_unit_price');
      request.input('actual_unit_price', sql.Decimal(18, 2), updates.actual_unit_price);
    }

    if (updates.total_quantity_received !== undefined) {
      setClause.push('total_quantity_received = @total_quantity_received');
      request.input('total_quantity_received', sql.Int, updates.total_quantity_received);
    }

    if (updates.pricing_confirmed !== undefined) {
      setClause.push('pricing_confirmed = @pricing_confirmed');
      request.input('pricing_confirmed', sql.Bit, updates.pricing_confirmed);
    }

    if (updates.remarks !== undefined) {
      setClause.push('remarks = @remarks');
      request.input('remarks', sql.Text, updates.remarks);
    }

    if (setClause.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    setClause.push('updated_at = GETDATE()');

    const query = `
      UPDATE stock_transactions_clean 
      SET ${setClause.join(', ')}
      OUTPUT INSERTED.*
      WHERE tender_id = @tender_id 
        AND item_master_id = @item_master_id
        AND (is_deleted = 0 OR is_deleted IS NULL)
    `;

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Stock transaction not found' });
    }
    res.json(result.recordset[0]);

  } catch (error) {
    res.status(500).json({ error: 'Failed to update stock transaction', details: error.message });
  }
});

// Soft delete stock transaction in stock_transactions_clean
app.delete('/api/stock-transactions-clean/:tender_id/:item_master_id', async (req, res) => {
  try {
    const { tender_id, item_master_id } = req.params;
    const { deleted_by = 'user' } = req.body;
    const query = `
      UPDATE stock_transactions_clean 
      SET 
        is_deleted = 1,
        deleted_at = GETDATE(),
        deleted_by = @deleted_by,
        updated_at = GETDATE()
      OUTPUT INSERTED.*
      WHERE tender_id = @tender_id 
        AND item_master_id = @item_master_id
        AND (is_deleted = 0 OR is_deleted IS NULL)
    `;

    const result = await pool.request()
      .input('tender_id', sql.UniqueIdentifier, tender_id)
      .input('item_master_id', sql.VarChar(50), item_master_id)
      .input('deleted_by', sql.VarChar(50), deleted_by)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Stock transaction not found' });
    }
    res.json({ success: true, message: 'Stock transaction deleted successfully' });

  } catch (error) {
    res.status(500).json({ error: 'Failed to delete stock transaction', details: error.message });
  }
});

// Restore soft deleted stock transaction in stock_transactions_clean
app.post('/api/stock-transactions-clean/:tender_id/:item_master_id/restore', async (req, res) => {
  try {
    const { tender_id, item_master_id } = req.params;
    const query = `
      UPDATE stock_transactions_clean 
      SET 
        is_deleted = 0,
        deleted_at = NULL,
        deleted_by = NULL,
        updated_at = GETDATE()
      OUTPUT INSERTED.*
      WHERE tender_id = @tender_id 
        AND item_master_id = @item_master_id
        AND is_deleted = 1
    `;

    const result = await pool.request()
      .input('tender_id', sql.UniqueIdentifier, tender_id)
      .input('item_master_id', sql.VarChar(50), item_master_id)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Deleted stock transaction not found' });
    }
    res.json(result.recordset[0]);

  } catch (error) {
    res.status(500).json({ error: 'Failed to restore stock transaction', details: error.message });
  }
});

// Add missing API endpoints for dashboard

// Get tenders from stock_transactions_clean
app.get('/api/tenders', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT 
        tender_id as id,
        'Tender ' + LEFT(CAST(tender_id AS VARCHAR(50)), 8) + '...' as title,
        'TND-' + LEFT(CAST(tender_id AS VARCHAR(50)), 8) as tender_number,
        CASE WHEN AVG(CAST(pricing_confirmed AS INT)) > 0.5 THEN 1 ELSE 0 END as is_finalized,
        MIN(created_at) as created_at,
        MAX(updated_at) as updated_at,
        COUNT(*) as item_count,
        SUM(estimated_unit_price) as estimated_value,
        SUM(actual_unit_price) as actual_value
      FROM stock_transactions_clean 
      WHERE (is_deleted = 0 OR is_deleted IS NULL)
      GROUP BY tender_id
      ORDER BY MAX(updated_at) DESC
    `;

    const result = await pool.request().query(query);
    res.json(result.recordset);
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tenders', details: error.message });
  }
});

// Get stock transactions by tender ID (for TransactionManager)
app.get('/api/stock-transactions', async (req, res) => {
  try {
    const { tender_id } = req.query;
    
    if (tender_id) {
      const query = `
        SELECT 
          id,
          tender_id,
          item_master_id,
          estimated_unit_price,
          actual_unit_price,
          total_quantity_received as quantity,
          pricing_confirmed,
          is_deleted,
          created_at,
          updated_at,
          -- Add fields that TransactionManager expects
          'Unknown Item' as nomenclature,
          '' as specifications
        FROM stock_transactions_clean
        WHERE tender_id = @tender_id
        AND (is_deleted = 0 OR is_deleted IS NULL)
        ORDER BY created_at DESC
      `;

      const result = await pool.request()
        .input('tender_id', require('mssql').UniqueIdentifier, tender_id)
        .query(query);
      res.json(result.recordset);
      
    } else {
      // Return all stock transactions if no tender_id filter
      const query = `
        SELECT 
          id,
          tender_id,
          item_master_id,
          estimated_unit_price,
          actual_unit_price,
          total_quantity_received as quantity,
          pricing_confirmed,
          is_deleted,
          created_at,
          updated_at
        FROM stock_transactions_clean
        WHERE (is_deleted = 0 OR is_deleted IS NULL)
        ORDER BY created_at DESC
      `;

      const result = await pool.request().query(query);
      res.json(result.recordset);
    }
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stock transactions', details: error.message });
  }
});

// Get deliveries (dummy data for now since we don't have delivery table)
app.get('/api/deliveries', async (req, res) => {
  try {
    // Return dummy delivery data based on stock transactions
    const query = `
      SELECT 
        NEWID() as id,
        tender_id,
        'Delivery for Tender ' + LEFT(CAST(tender_id AS VARCHAR(50)), 8) + '...' as delivery_note,
        CASE WHEN pricing_confirmed = 1 THEN 'delivered' ELSE 'pending' END as status,
        updated_at as delivery_date,
        actual_unit_price as value
      FROM stock_transactions_clean 
      WHERE (is_deleted = 0 OR is_deleted IS NULL)
      AND actual_unit_price > 0
      ORDER BY updated_at DESC
    `;

    const result = await pool.request().query(query);
    res.json(result.recordset);
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deliveries', details: error.message });
  }
});

// Get inventory stock (dummy data for now)
app.get('/api/inventory-stock', async (req, res) => {
  try {
    // Return summary data based on stock transactions
    const query = `
      SELECT 
        item_master_id as id,
        'Item ' + LEFT(CAST(item_master_id AS VARCHAR(50)), 8) + '...' as item_name,
        SUM(total_quantity_received) as current_stock,
        SUM(actual_unit_price) as total_value,
        AVG(actual_unit_price) as unit_price,
        MAX(updated_at) as last_updated
      FROM stock_transactions_clean 
      WHERE (is_deleted = 0 OR is_deleted IS NULL)
      GROUP BY item_master_id
      HAVING SUM(total_quantity_received) > 0
      ORDER BY MAX(updated_at) DESC
    `;

    const result = await pool.request().query(query);
    res.json(result.recordset);
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory stock', details: error.message });
  }
});

// Get specific tender by ID
app.get('/api/tenders/:id', async (req, res) => {
  console.log(`🔍 API call to /api/tenders/${req.params.id}`);
  
  try {
    const request = new sql.Request();
    request.input('tenderId', sql.VarChar, req.params.id);
    
    const result = await request.query(`
      SELECT * FROM tenders 
      WHERE id = @tenderId
    `);
    
    if (result.recordset.length === 0) {
      console.log(`❌ Tender ${req.params.id} not found`);
      return res.status(404).json({ error: 'Tender not found' });
    }
    
    console.log(`✅ Retrieved tender ${req.params.id}:`, result.recordset[0]);
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('❌ Error fetching tender:', error);
    res.status(500).json({ error: 'Failed to fetch tender' });
  }
});

// New endpoint for the SQL Server view: View_stock_transactions_clean
app.get('/api/view-stock-transactions-clean', async (req, res) => {
  try {
    const { tender_id } = req.query;
    
    let query = `
      SELECT 
        id,
        tender_id,
        reference_number,
        title,
        publish_date,
        publication_date,
        submission_date,
        submission_deadline,
        opening_date,
        item_master_id,
        nomenclature,
        sub_category_name,
        category_id,
        sub_category_id,
        actual_unit_price,
        total_quantity_received,
        type,
        pricing_confirmed,
        is_deleted
      FROM View_stock_transactions_clean
      WHERE (is_deleted = 0 OR is_deleted IS NULL)
    `;
    
    const request = pool.request();
    
    if (tender_id) {
      query += ` AND tender_id = @tender_id`;
      request.input('tender_id', sql.UniqueIdentifier, tender_id);
    }
    
    query += ` ORDER BY title, nomenclature`;
    
    const result = await request.query(query);
    
    console.log(`✅ Retrieved ${result.recordset.length} records from View_stock_transactions_clean`);
    if (tender_id) {
      console.log(`📊 Filtered by tender_id: ${tender_id}`);
    }
    
    res.json(result.recordset);
    
  } catch (error) {
    console.error('❌ Error fetching from view:', error);
    res.status(500).json({ 
      error: 'Failed to fetch from View_stock_transactions_clean', 
      details: error.message 
    });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  if (pool) {
    await pool.close();
  }
  process.exit(0);
});

startServer().catch(err => process.exit(1));
