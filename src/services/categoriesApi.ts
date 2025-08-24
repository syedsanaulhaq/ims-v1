
import { ApiResponse } from './api';
import { categoriesSupabaseService } from './categoriesSupabaseService';
import { Category, SubCategory, CategoriesResponse } from '@/hooks/useCategoriesData';

// Categories now use Supabase for all CRUD operations
export const categoriesApi = {
  // Get all categories and subcategories - Use Supabase
  getCategories: async (): Promise<ApiResponse<CategoriesResponse>> => {
    
    return await categoriesSupabaseService.getCategories();
  },

  // (All CRUD methods are defined above. Duplicate methods removed.)

  // Create category - Use Supabase
  createCategory: async (category: Omit<Category, 'id' | 'createdDate' | 'status'>): Promise<ApiResponse<Category>> => {
    
    return await categoriesSupabaseService.createCategory(category);
  },

  // Update category - Use Supabase
  updateCategory: async (category: Category): Promise<ApiResponse<Category>> => {
    
    return await categoriesSupabaseService.updateCategory(category);
  },

  // Create subcategory - Use Supabase
  createSubCategory: async (subCategory: Omit<SubCategory, 'id' | 'createdDate' | 'status'>): Promise<ApiResponse<SubCategory>> => {
    
    return await categoriesSupabaseService.createSubCategory(subCategory);
  },

  // Update subcategory - Use Supabase
  updateSubCategory: async (subCategory: SubCategory): Promise<ApiResponse<SubCategory>> => {
    
    return await categoriesSupabaseService.updateSubCategory(subCategory);
  },

  // Delete category - Use Supabase
  deleteCategory: async (categoryId: string): Promise<ApiResponse<null>> => {
    
    return await categoriesSupabaseService.deleteCategory(categoryId);
  },

  // Delete subcategory - Use Supabase
  deleteSubCategory: async (subCategoryId: string): Promise<ApiResponse<null>> => {
    
    return await categoriesSupabaseService.deleteSubCategory(subCategoryId);
  },
};
