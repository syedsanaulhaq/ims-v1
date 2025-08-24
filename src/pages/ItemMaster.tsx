import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import ItemMasterForm from '@/components/itemmaster/ItemMasterForm';
import { type ItemMaster, CreateItemMasterRequest } from '@/types/tender';
import { useItemMasterData } from '@/hooks/useItemMasterData';
import LoadingSpinner from "@/components/common/LoadingSpinner";

const ItemMasterPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemMaster | null>(null);
  
  const { 
    itemMasters, 
    isLoading, 
    createItemMaster, 
    updateItemMaster, 
    deleteItemMaster,
    isCreatingItemMaster,
    isUpdatingItemMaster,
    isDeletingItemMaster 
  } = useItemMasterData();

  const handleCreateItem = async (itemData: CreateItemMasterRequest) => {

    try {
      await createItemMaster(itemData);
      
      setShowForm(false);
    } catch (error) {
      
    }
  };

  const handleEditItem = (item: ItemMaster) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleUpdateItem = async (itemData: CreateItemMasterRequest) => {
    if (!editingItem) return;

    try {
      await updateItemMaster(editingItem.id, itemData);
      
      setShowForm(false);
      setEditingItem(null);
    } catch (error) {
      
    }
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      
      deleteItemMaster(id);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <LoadingSpinner size="lg" className="mr-2" />
        <span>Loading Item Masters...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Item Master</h1>
          <p className="text-muted-foreground mt-2">Manage all items with categories and specifications</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)} 
          className="flex items-center space-x-2"
          disabled={isCreatingItemMaster || isUpdatingItemMaster}
        >
          <Plus className="h-4 w-4" />
          <span>Add Item</span>
        </Button>
      </div>

      {showForm ? (
        <ItemMasterForm
          onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
          onCancel={handleCancelForm}
          isLoading={isCreatingItemMaster || isUpdatingItemMaster}
          initialData={editingItem ? {
            itemCode: editingItem.itemCode,
            nomenclature: editingItem.nomenclature,
            categoryId: editingItem.categoryId,
            subCategoryId: editingItem.subCategoryId,
            unit: editingItem.unit,
            specifications: editingItem.specifications,
            description: editingItem.description,
          } : undefined}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>All Items</span>
            </CardTitle>
            <CardDescription>Complete list of all items in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {itemMasters.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No items found. Create your first item to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Nomenclature</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Sub-Category</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemMasters.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.itemCode}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.nomenclature}</div>
                          {item.specifications && (
                            <div className="text-sm text-muted-foreground">{item.specifications}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.categoryName}</TableCell>
                      <TableCell>{item.subCategoryName}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>
                        <Badge variant={item.isActive ? "default" : "secondary"}>
                          {item.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditItem(item)}
                            disabled={isDeletingItemMaster}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600"
                            onClick={() => handleDeleteItem(item.id)}
                            disabled={isDeletingItemMaster}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ItemMasterPage;
