import { ApiResponse } from './api';
import { inventorySupabaseService } from './inventorySupabaseService';
import { InventoryItem, Vendor, Transaction, StockTransaction } from '@/hooks/useInventoryData';

export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  totalVendors: number;
  thisMonthPurchases: number;
}

export interface Category {
  id: string;
  name: string;
  CategoryName: string;
}

export interface Office {
  id: string;
  name: string;
  type: string;
}

// Normalized: Only inventory-specific fields, reference item master by ID
export interface CreateInventoryItemRequest {
  itemMasterId: string;
  currentStock: number;
  minimumStock: number;
  maximumStock?: number;
  reorderLevel?: number;
  vendorId?: string;
  itemType?: string;
  status?: string;
  description?: string;
  storeId: string; // Use storeId instead of location
}

export interface UpdateInventoryItemRequest {
  id: string;
  itemMasterId: string;
  currentStock: number;
  minimumStock: number;
  maximumStock?: number;
  reorderLevel?: number;
  vendorId?: string;
  itemType?: string;
  status?: string;
  description?: string;
  storeId?: string; // Use storeId instead of location
}

export interface CreateStockTransactionRequest {
  items: any[];
  vendorId: string;
  vendorName: string;
  procurementProcedure: string;
  transactionDate: string;
  totalAmount: number;
  status: string;
  createdBy: string;
  remarks: string;
}

export interface UpdateStockTransactionRequest {
  items?: any[];
  vendorId?: string;
  vendorName?: string;
  procurementProcedure?: string;
  transactionDate?: string;
  totalAmount?: number;
  status?: string;
  remarks?: string;
}

export type StockTransactionStatus = 'Pending' | 'Completed' | 'Verified';

export const inventoryApi = {
  // Inventory Items
  getInventoryItems: async (): Promise<ApiResponse<InventoryItem[]>> => {
    try {
      const data = await inventorySupabaseService.getAll();
      
      // Map database schema to API schema based on actual table structure
      const mapped = data.map(item => ({
        id: item.id,
        itemMasterId: item.item_master_id,
        currentStock: item.current_stock ?? 0,
        minimumStock: item.minimum_stock ?? 0,
        maximumStock: item.maximum_stock ?? undefined,
        reorderLevel: item.reorder_level ?? undefined,
        location: item.stores?.store_name || 'Unknown Store',
        storeId: item.store_id, // Add the actual store_id for editing
        vendorId: item.vendor_id ?? undefined,
        status: item.status ?? 'Active',
        itemType: item.item_type || 'Consumable Items', // Based on schema default
        // Get name and unit from item_masters join
        name: item.item_masters?.nomenclature || 'Unknown Item',
        unit: item.item_masters?.unit || 'PCS',
        // Get real categories from item_masters joins
        category: item.item_masters?.categories?.category_name || 'General',
        subCategory: item.item_masters?.sub_categories?.sub_category_name || 'General',
      }));
      
      return { data: mapped, success: true, message: 'Success' };
    } catch (error: any) {
      return { data: [], success: false, message: error.message };
    }
  },

  getInventoryItem: async (id: string): Promise<ApiResponse<InventoryItem>> => {
    try {
      const item = await inventorySupabaseService.getById(id);
      const mapped = {
        id: item.id,
        itemMasterId: item.item_master_id,
        currentStock: item.current_stock ?? 0,
        minimumStock: item.minimum_stock ?? 0,
        maximumStock: item.maximum_stock ?? undefined,
        reorderLevel: item.reorder_level ?? undefined,
        location: item.stores?.store_name || 'Unknown Store',
        storeId: item.store_id, // Add the actual store_id for editing
        vendorId: item.vendor_id ?? undefined,
        status: item.status ?? 'Active',
        itemType: item.item_type || 'Consumable Items',
        name: item.item_masters?.nomenclature || 'Unknown Item',
        unit: item.item_masters?.unit || 'PCS',
        category: item.item_masters?.categories?.category_name || 'General',
        subCategory: item.item_masters?.sub_categories?.sub_category_name || 'General',
      };
      return { data: mapped, success: true, message: 'Success' };
    } catch (error: any) {
      return { data: undefined as any, success: false, message: error.message };
    }
  },

  createInventoryItem: async (item: CreateInventoryItemRequest): Promise<ApiResponse<InventoryItem>> => {
    try {
      // Map CreateInventoryItemRequest to actual database schema
      const mappedInsert = {
        item_master_id: item.itemMasterId, // Use the actual foreign key
        current_stock: item.currentStock,
        minimum_stock: item.minimumStock,
        maximum_stock: item.maximumStock,
        reorder_level: item.reorderLevel,
        vendor_id: item.vendorId,
        item_type: item.itemType || 'Consumable Items', // Use schema default
        status: item.status || 'Active',
        store_id: item.storeId, // Use the provided store_id
        description: item.description || null,
      };
      const created = await inventorySupabaseService.create(mappedInsert);
      const mapped = {
        id: created.id,
        itemMasterId: created.item_master_id,
        currentStock: created.current_stock ?? 0,
        minimumStock: created.minimum_stock ?? 0,
        maximumStock: created.maximum_stock ?? undefined,
        reorderLevel: created.reorder_level ?? undefined,
        location: 'Store', // Will be populated from store join
        vendorId: created.vendor_id ?? undefined,
        status: created.status ?? 'Active',
        itemType: created.item_type || 'Consumable Items',
        name: 'New Item', // Will need to fetch from item_masters
        unit: 'PCS',
        category: 'General',
        subCategory: 'General',
      };
      return { data: mapped, success: true, message: 'Created' };
    } catch (error: any) {
      return { data: undefined as any, success: false, message: error.message };
    }
  },

  updateInventoryItem: async (item: UpdateInventoryItemRequest): Promise<ApiResponse<InventoryItem>> => {
    try {
      const mappedUpdate = {
        item_master_id: item.itemMasterId,
        current_stock: item.currentStock,
        minimum_stock: item.minimumStock,
        maximum_stock: item.maximumStock,
        reorder_level: item.reorderLevel,
        vendor_id: item.vendorId,
        item_type: item.itemType,
        status: item.status,
        description: item.description,
        store_id: item.storeId, // Include store_id in update
      };
      const updated = await inventorySupabaseService.update(item.id, mappedUpdate);
      const mapped = {
        id: updated.id,
        itemMasterId: updated.item_master_id,
        currentStock: updated.current_stock ?? 0,
        minimumStock: updated.minimum_stock ?? 0,
        maximumStock: updated.maximum_stock ?? undefined,
        reorderLevel: updated.reorder_level ?? undefined,
        location: 'Store', // Will be populated from store join
        vendorId: updated.vendor_id ?? undefined,
        status: updated.status ?? 'Active',
        itemType: updated.item_type || 'Consumable Items',
        name: 'Updated Item', // Will need to fetch from item_masters
        unit: 'PCS',
        category: 'General',
        subCategory: 'General',
      };
      return { data: mapped, success: true, message: 'Updated' };
    } catch (error: any) {
      return { data: undefined as any, success: false, message: error.message };
    }
  },

  deleteInventoryItem: async (id: string): Promise<ApiResponse<void>> => {
    try {
      await inventorySupabaseService.remove(id);
      return { data: undefined, success: true, message: 'Deleted' };
    } catch (error: any) {
      return { data: undefined, success: false, message: error.message };
    }
  },

  // Vendors (TODO: implement real Supabase calls if needed)
  getVendors: async (): Promise<ApiResponse<Vendor[]>> => {
    try {
      const data = await inventorySupabaseService.getVendors();
      return { data: data || [], success: true, message: 'Success' };
    } catch (error: any) {
      return { data: [], success: false, message: error.message };
    }
  },

  getStores: async (): Promise<ApiResponse<any[]>> => {
    try {
      const data = await inventorySupabaseService.getStores();
      return { data: data || [], success: true, message: 'Success' };
    } catch (error: any) {
      return { data: [], success: false, message: error.message };
    }
  },

  getActiveVendors: async (): Promise<ApiResponse<Vendor[]>> => {
    return { data: [], success: false, message: 'Not implemented' };
  },

  // Transactions (TODO: implement real Supabase calls if needed)
  getTransactions: async (): Promise<ApiResponse<Transaction[]>> => {
    return { data: [], success: false, message: 'Not implemented' };
  },

  getThisMonthPurchases: async (): Promise<ApiResponse<Transaction[]>> => {
    return { data: [], success: false, message: 'Not implemented' };
  },

  // Stock Transactions (TODO: implement real Supabase calls if needed)
  getStockTransactions: async (): Promise<ApiResponse<StockTransaction[]>> => {
    return { data: [], success: false, message: 'Not implemented' };
  },

  createStockTransaction: async (transaction: CreateStockTransactionRequest): Promise<ApiResponse<StockTransaction>> => {
    return { data: undefined as any, success: false, message: 'Not implemented' };
  },

  updateStockTransaction: async (id: string, transaction: UpdateStockTransactionRequest): Promise<ApiResponse<StockTransaction>> => {
    return { data: undefined as any, success: false, message: 'Not implemented' };
  },

  updateStockTransactionStatus: async (id: string, status: StockTransactionStatus): Promise<ApiResponse<StockTransaction>> => {
    return { data: undefined as any, success: false, message: 'Not implemented' };
  },

  // Statistics (TODO: implement real Supabase calls if needed)
  getStats: async (): Promise<ApiResponse<InventoryStats>> => {
    return { data: undefined as any, success: false, message: 'Not implemented' };
  },
};
