# 📦 Inventory Management System (IMS) v1.0

A comprehensive, full-stack inventory management system built with modern web technologies and real-time data integration.

## 🌟 Key Features

### 📊 **Real-time Dashboard & Analytics**
- **Live System Metrics** with real-time data from SQL Server
- **Interactive Charts** showing inventory trends, stock status, and performance
- **Advanced Visualizations** using Recharts library
- **Performance Indicators** across all system modules
- **Monthly Activity Trends** with historical data analysis

### 📦 **Complete Inventory Management**
- **Real-time Stock Tracking** with current quantities and availability
- **Stock Status Monitoring** (Normal, Low Stock, Out of Stock, Overstock)
- **Movement History** with complete audit trails and authorization tracking
- **Inventory Valuation** with category-wise breakdown and real pricing
- **Automated Low Stock Alerts** with customizable thresholds

### 🔄 **Advanced Workflow Integration**
- **Stock Issuance Requests** with multi-level approval workflows
- **Automatic Inventory Updates** on delivery finalization
- **Stock Return Management** with approval processes and inventory restoration
- **Movement Logging** for all inventory transactions with full audit trails
- **Transaction Safety** using SQL Server transactions for data integrity

### 🏢 **Procurement & Tender Management**
- **Comprehensive Tender Management** with full lifecycle tracking
- **Delivery Management** with real-time status tracking
- **Vendor Management** and performance analytics
- **Multi-level Approval Workflows** with proper authorization chains

### 👥 **User & Organization Management**
- **Role-based Access Control** with proper user management
- **Office and Wing Management** for organizational structure
- **Department Management** with hierarchical organization
- **User Activity Tracking** and session management

## 🚀 Production Deployment

### Prerequisites
- Node.js 18+ 
- SQL Server 2019+
- Windows Server or compatible hosting environment

### Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd inventory-management-system-ims
   npm install
   ```

2. **Database Setup**
   ```sql
   CREATE DATABASE InventoryManagementDB_PROD;
   -- Run schema scripts from database/ folder
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env.production
   # Configure your production database settings
   ```

4. **Build and Start**
   ```bash
   npm run build
   npm run start:production
   ```

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for build optimization
- **Tailwind CSS** for styling
- **Shadcn/UI** component library

### Backend
- **Node.js** Express server
- **SQL Server** database
- RESTful API architecture
- Production-optimized middleware

### Key Features
- ✅ **Stock Acquisition Management**
- ✅ **Real-time Inventory Tracking** 
- ✅ **Multi-tender Support**
- ✅ **Dashboard Analytics**
- ✅ **Role-based Access Control**
- ✅ **Audit Trail System**

## 📊 System Components

### Core Modules
- **Dashboard** - Executive overview and KPIs
- **Stock Acquisition** - Purchase order and tender management
- **Transaction Manager** - Stock movement tracking
- **Inventory Control** - Real-time stock monitoring
- **Reporting** - Analytics and compliance reports

### Database Schema
- **item_masters** - Product catalog
- **stock_transactions_clean** - Transaction records
- **tenders** - Procurement processes
- **current_inventory_stock** - Real-time inventory
- **users** - Authentication and authorization

## 🔧 Configuration

### Environment Variables
```env
NODE_ENV=production
DB_HOST=your-sql-server
DB_PORT=1433
DB_NAME=InventoryManagementDB_PROD
DB_USER=your-username
DB_PASSWORD=your-password
PORT=3001
```

### Production Settings
- Compression enabled
- CORS configured for production domains
- Database connection pooling
- Error logging to files
- Performance monitoring

## 🚀 Deployment

### Option 1: Windows Server
```bash
# Install as Windows Service
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 startup
```

### Option 2: Docker
```bash
docker build -t ims-production .
docker run -d -p 3001:3001 --env-file .env.production ims-production
```

### Option 3: IIS
- Build static files: `npm run build`
- Deploy dist/ folder to IIS
- Configure URL rewrite for SPA
- Set up reverse proxy for API

## 📋 Production Checklist

### Before Deployment
- [ ] Database schema deployed
- [ ] Environment variables configured  
- [ ] SSL certificates installed
- [ ] Backup strategy implemented
- [ ] Monitoring tools configured

### After Deployment
- [ ] Health checks passing
- [ ] Database connections stable
- [ ] User authentication working
- [ ] Reports generating correctly
- [ ] Performance metrics optimal

## 🔒 Security

### Authentication
- JWT-based session management
- Role-based access control (RBAC)
- Password policy enforcement
- Session timeout configuration

### Data Protection
- SQL injection prevention
- Input validation and sanitization
- Encrypted sensitive data storage
- Audit trail for all transactions

## 📈 Performance

### Optimization Features
- Database query optimization
- Connection pooling
- Response compression
- Static asset caching
- CDN integration ready

### Monitoring
- Application performance metrics
- Database performance tracking
- Error rate monitoring
- User activity analytics

## 🆘 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check SQL Server connectivity
sqlcmd -S server -U username -P password
```

**Application Won't Start**
```bash
# Check logs
tail -f logs/application.log
```

**Performance Issues**
```bash
# Monitor system resources
npm run health-check
```

## 📞 Support

### Documentation
- API documentation: `/api/docs`
- User manual: Available in admin panel
- System requirements: See deployment guide

### Contact
- Technical Support: [support-email]
- System Administration: [admin-email]
- Emergency Contact: [emergency-contact]

---

**System Version:** 1.0.0  
**Last Updated:** July 2025  
**Supported Browsers:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
