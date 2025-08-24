
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '@/services/categoriesApi';

export interface Category {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
  createdDate: string;
  updatedDate?: string;
}

export interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
  createdDate: string;
  updatedDate?: string;
}

export interface CategoriesResponse {
  categories: Category[];
  subCategories: SubCategory[];
}

export const useCategoriesData = () => {
  const queryClient = useQueryClient();

  const {
    data: categoriesData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      
      const response = await categoriesApi.getCategories();

      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Improved data extraction logic - properly handle ApiResponse<CategoriesResponse> structure
  let categories: Category[] = [];
  let subCategories: SubCategory[] = [];

  // Type guard for CategoriesResponse
  function isCategoriesResponse(obj: any): obj is CategoriesResponse {
    return (
      obj &&
      Array.isArray(obj.categories) &&
      Array.isArray(obj.subCategories)
    );
  }

  // Try to extract from .data or directly
  const raw = categoriesData?.data ?? categoriesData;
  if (isCategoriesResponse(raw)) {
    categories = raw.categories;
    subCategories = raw.subCategories;
  }

  const createCategoryMutation = useMutation({
    mutationFn: categoriesApi.createCategory,
    onSuccess: (response) => {
      
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: categoriesApi.updateCategory,
    onSuccess: (response) => {
      
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      
    },
  });

  const createSubCategoryMutation = useMutation({
    mutationFn: categoriesApi.createSubCategory,
    onSuccess: (response) => {
      
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      
    },
  });

  const updateSubCategoryMutation = useMutation({
    mutationFn: categoriesApi.updateSubCategory,
    onSuccess: (response) => {
      
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: categoriesApi.deleteCategory,
    onSuccess: (response) => {
      
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      
    },
  });

  const deleteSubCategoryMutation = useMutation({
    mutationFn: categoriesApi.deleteSubCategory,
    onSuccess: (response) => {
      
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      
    },
  });

  return {
    categories,
    subCategories,
    isLoading,
    error,
    refetch,
    createCategory: createCategoryMutation.mutate,
    updateCategory: updateCategoryMutation.mutate,
    deleteCategory: deleteCategoryMutation.mutate,
    createSubCategory: createSubCategoryMutation.mutate,
    updateSubCategory: updateSubCategoryMutation.mutate,
    deleteSubCategory: deleteSubCategoryMutation.mutate,
    isCreatingCategory: createCategoryMutation.isPending,
    isUpdatingCategory: updateCategoryMutation.isPending,
    isDeletingCategory: deleteCategoryMutation.isPending,
    isCreatingSubCategory: createSubCategoryMutation.isPending,
    isUpdatingSubCategory: updateSubCategoryMutation.isPending,
    isDeletingSubCategory: deleteSubCategoryMutation.isPending,
  };
};
