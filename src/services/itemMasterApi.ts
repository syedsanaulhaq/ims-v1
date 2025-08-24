import { ItemMaster, CreateItemMasterRequest } from '../types/tender';
import { inventorySupabaseService } from './inventorySupabaseService';

export interface UpdateItemMasterRequest {
  id: string;
  itemCode: string;
  nomenclature: string;
  categoryId: string;
  subCategoryId: string;
  unit: string;
  specifications?: string;
  description?: string;
}

// Transform API response to ItemMaster format
const transformToItemMaster = (apiItem: any): ItemMaster => ({
  id: apiItem.id || apiItem.Id,
  itemCode: apiItem.item_code || apiItem.itemCode || apiItem.ItemCode,
  nomenclature: apiItem.nomenclature || apiItem.Nomenclature,
  categoryId: apiItem.category_id || apiItem.categoryId || apiItem.CategoryId,
  categoryName: apiItem.categories?.category_name || apiItem.categoryName || apiItem.CategoryName,
  subCategoryId: apiItem.sub_category_id || apiItem.subCategoryId || apiItem.SubCategoryId,
  subCategoryName: apiItem.sub_categories?.sub_category_name || apiItem.subCategoryName || apiItem.SubCategoryName,
  unit: apiItem.unit || apiItem.Unit,
  specifications: apiItem.specifications || apiItem.Specifications || '',
  description: apiItem.description || apiItem.Description || '',
  isActive: apiItem.is_active !== undefined ? apiItem.is_active : (apiItem.isActive !== undefined ? apiItem.isActive : (apiItem.status === 'Active' || apiItem.Status === 'Active')),
  createdAt: apiItem.created_at || apiItem.createdAt || apiItem.CreatedDate,
  updatedAt: apiItem.updated_at || apiItem.updatedAt || apiItem.ModifiedDate,
});

export const itemMasterApi = {
  // Get all item masters
  getItemMasters: async (): Promise<ItemMaster[]> => {
    try {
      
      const data = await inventorySupabaseService.getItemMasters();
      
      if (Array.isArray(data)) {
        return data.map(transformToItemMaster);
      }

      return [];
    } catch (error) {
      
      throw error;
    }
  },

  // Get specific item master by ID
  getItemMaster: async (id: string): Promise<ItemMaster> => {
    try {
      
      const data = await inventorySupabaseService.getItemMaster(id);
      return transformToItemMaster(data);
    } catch (error) {
      
      throw error;
    }
  },

  // Create new item master
  createItemMaster: async (itemData: CreateItemMasterRequest): Promise<ItemMaster> => {
    try {

      const data = await inventorySupabaseService.createItemMaster(itemData);
      
      return transformToItemMaster(data);
    } catch (error) {
      
      throw error;
    }
  },

  // Update existing item master
  updateItemMaster: async (itemData: UpdateItemMasterRequest): Promise<ItemMaster> => {
    try {

      const { id, ...updateData } = itemData;
      const data = await inventorySupabaseService.updateItemMaster(id, updateData);
      
      return transformToItemMaster(data);
    } catch (error) {
      
      throw error;
    }
  },

  // Delete item master
  deleteItemMaster: async (id: string): Promise<void> => {
    try {

      await inventorySupabaseService.deleteItemMaster(id);

    } catch (error) {
      
      throw error;
    }
  },
};
