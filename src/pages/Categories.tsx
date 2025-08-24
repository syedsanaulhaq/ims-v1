import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, FolderOpen, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategoriesData } from "@/hooks/useCategoriesData";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorState from "@/components/common/ErrorState";
import { formatDateDMY } from '@/utils/dateUtils';

const Categories = () => {
  const { toast } = useToast();
  const {
    categories,
    subCategories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory,
    isCreatingCategory,
    isUpdatingCategory,
    isDeletingCategory,
    isCreatingSubCategory,
    isUpdatingSubCategory,
    isDeletingSubCategory,
  } = useCategoriesData();

  // Debug logging
  useEffect(() => {

  }, [categories, subCategories, isLoading, error]);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSubCategoryForm, setShowSubCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<any>(null);

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });

  const [newSubCategory, setNewSubCategory] = useState({
    categoryId: '',
    name: '',
    description: ''
  });

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      description: category.description
    });
    setShowCategoryForm(true);
  };

  const handleEditSubCategory = (subCategory: any) => {
    setEditingSubCategory(subCategory);
    setNewSubCategory({
      categoryId: subCategory.categoryId, // Keep as string
      name: subCategory.name,
      description: subCategory.description
    });
    setShowSubCategoryForm(true);
  };

  const handleUpdateCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive"
      });
      return;
    }

    if (!editingCategory) return;

    const updatedCategory = {
      ...editingCategory,
      name: newCategory.name,
      description: newCategory.description
    };

    try {
      
      await updateCategory(updatedCategory);
      
      // Only reset form state on success
      setEditingCategory(null);
      setNewCategory({ name: '', description: '' });
      setShowCategoryForm(false);
      
      toast({
        title: "Success",
        description: "Category updated successfully"
      });
    } catch (error: any) {
      
      toast({
        title: "Error",
        description: error?.message || "Failed to update category",
        variant: "destructive"
      });
    }
  };

  const handleUpdateSubCategory = async () => {
    if (!newSubCategory.name.trim()) {
      toast({
        title: "Error",
        description: "Sub-category name is required",
        variant: "destructive"
      });
      return;
    }

    if (!editingSubCategory) return;

    const updatedSubCategory = {
      ...editingSubCategory,
      categoryId: newSubCategory.categoryId, // Keep as string
      name: newSubCategory.name,
      description: newSubCategory.description
    };

    try {
      
      await updateSubCategory(updatedSubCategory);
      
      // Only reset form state on success
      setEditingSubCategory(null);
      setNewSubCategory({ categoryId: '', name: '', description: '' });
      setShowSubCategoryForm(false);
      
      toast({
        title: "Success",
        description: "Sub-category updated successfully"
      });
    } catch (error: any) {
      
      toast({
        title: "Error",
        description: error?.message || "Failed to update sub-category",
        variant: "destructive"
      });
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      
      await createCategory(newCategory);
      
      // Only reset form state on success
      setNewCategory({ name: '', description: '' });
      setShowCategoryForm(false);
      
      toast({
        title: "Success",
        description: "Category added successfully"
      });
    } catch (error: any) {
      
      toast({
        title: "Error",
        description: error?.message || "Failed to add category",
        variant: "destructive"
      });
    }
  };

  const handleAddSubCategory = async () => {
    if (!newSubCategory.name.trim()) {
      toast({
        title: "Error",
        description: "Sub-category name is required",
        variant: "destructive"
      });
      return;
    }

    if (!newSubCategory.categoryId) {
      toast({
        title: "Error",
        description: "Parent category is required",
        variant: "destructive"
      });
      return;
    }

    const subCategoryData = {
      categoryId: newSubCategory.categoryId, // Keep as string
      name: newSubCategory.name,
      description: newSubCategory.description
    };

    try {
      
      await createSubCategory(subCategoryData);
      
      // Only reset form state on success
      setNewSubCategory({ categoryId: '', name: '', description: '' });
      setShowSubCategoryForm(false);
      
      toast({
        title: "Success",
        description: "Sub-category added successfully"
      });
    } catch (error: any) {
      
      toast({
        title: "Error",
        description: error?.message || "Failed to add sub-category",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category? This will also delete all its sub-categories.')) {
      try {
        deleteCategory(categoryId);
        toast({
          title: "Success",
          description: "Category deleted successfully",
        });
      } catch (error: any) {
        
        toast({
          title: "Error",
          description: error?.message || "Failed to delete category",
          variant: "destructive"
        });
      }
    }
  };

  const handleDeleteSubCategory = (subCategoryId: string) => {
    if (window.confirm('Are you sure you want to delete this sub-category?')) {
      try {
        deleteSubCategory(subCategoryId);
        toast({
          title: "Success",
          description: "Sub-category deleted successfully",
        });
      } catch (error: any) {
        
        toast({
          title: "Error",
          description: error?.message || "Failed to delete sub-category",
          variant: "destructive"
        });
      }
    }
  };

  const handleCancelCategory = () => {
    setEditingCategory(null);
    setNewCategory({ name: '', description: '' });
    setShowCategoryForm(false);
  };

  const handleCancelSubCategory = () => {
    setEditingSubCategory(null);
    setNewSubCategory({ categoryId: '', name: '', description: '' });
    setShowSubCategoryForm(false);
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || 'Unknown';
  };

  if (isLoading) {
    
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" className="mx-auto" />
        <p className="text-center mt-4 text-muted-foreground">Loading categories...</p>
      </div>
    );
  }

  if (error) {
    
    return (
      <div className="p-6">
        <ErrorState 
          message="Failed to load categories. There was an error loading the categories data."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Category Management</h1>
          <p className="text-muted-foreground mt-2">Manage categories and sub-categories for your inventory</p>
        </div>
      </div>

      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="subcategories">Sub-Categories</TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setShowCategoryForm(true)} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Category</span>
            </Button>
          </div>

          {/* Add/Edit Category Form */}
          {showCategoryForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="categoryName">Category Name *</Label>
                    <Input
                      id="categoryName"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="Enter category name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoryDescription">Description</Label>
                    <Input
                      id="categoryDescription"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder="Enter category description"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
                    disabled={isCreatingCategory || isUpdatingCategory}
                  >
                    {isCreatingCategory || isUpdatingCategory ? (
                      <>
                        <LoadingSpinner size="sm" />
                        {editingCategory ? 'Updating...' : 'Saving...'}
                      </>
                    ) : (
                      editingCategory ? 'Update Category' : 'Save Category'
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleCancelCategory}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Categories Table */}
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>All categories in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <FolderOpen className="h-4 w-4 text-blue-500" />
                          <div>
                            <div className="font-medium">{category.name}</div>
                            <div className="text-sm text-muted-foreground">{category.description}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          category.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {category.status}
                        </span>
                      </TableCell>
                      <TableCell>{formatDateDMY(category.createdDate)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditCategory(category)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sub-Categories Tab */}
        <TabsContent value="subcategories" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setShowSubCategoryForm(true)} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Sub-Category</span>
            </Button>
          </div>

          {/* Add/Edit Sub-Category Form */}
          {showSubCategoryForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingSubCategory ? 'Edit Sub-Category' : 'Add New Sub-Category'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="subCategoryParent">Parent Category *</Label>
                    <Select
                      value={newSubCategory.categoryId}
                      onValueChange={(value) => setNewSubCategory({ ...newSubCategory, categoryId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Parent Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subCategoryName">Sub-Category Name *</Label>
                    <Input
                      id="subCategoryName"
                      value={newSubCategory.name}
                      onChange={(e) => setNewSubCategory({ ...newSubCategory, name: e.target.value })}
                      placeholder="Enter sub-category name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subCategoryDescription">Description</Label>
                    <Input
                      id="subCategoryDescription"
                      value={newSubCategory.description}
                      onChange={(e) => setNewSubCategory({ ...newSubCategory, description: e.target.value })}
                      placeholder="Enter sub-category description"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={editingSubCategory ? handleUpdateSubCategory : handleAddSubCategory}
                    disabled={isCreatingSubCategory || isUpdatingSubCategory}
                  >
                    {isCreatingSubCategory || isUpdatingSubCategory ? (
                      <>
                        <LoadingSpinner size="sm" />
                        {editingSubCategory ? 'Updating...' : 'Saving...'}
                      </>
                    ) : (
                      editingSubCategory ? 'Update Sub-Category' : 'Save Sub-Category'
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleCancelSubCategory}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sub-Categories Table */}
          <Card>
            <CardHeader>
              <CardTitle>Sub-Categories</CardTitle>
              <CardDescription>All sub-categories in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sub-Category Details</TableHead>
                    <TableHead>Parent Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subCategories.map((subCategory) => (
                    <TableRow key={subCategory.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Tag className="h-4 w-4 text-green-500" />
                          <div>
                            <div className="font-medium">{subCategory.name}</div>
                            <div className="text-sm text-muted-foreground">{subCategory.description}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryName(subCategory.categoryId)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          subCategory.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {subCategory.status}
                        </span>
                      </TableCell>
                      <TableCell>{formatDateDMY(subCategory.createdDate)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditSubCategory(subCategory)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600"
                            onClick={() => handleDeleteSubCategory(subCategory.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Categories;
