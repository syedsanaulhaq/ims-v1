import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, Plus, Save, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ItemMaster {
  ItemMasterID: number;
  ItemDescription: string;
  Unit: string;
  Category: string;
  MinimumLevel: number;
  MaximumLevel: number;
}

interface InitialStock {
  ItemMasterID: number;
  quantity: number;
  notes: string;
}

const InitialInventorySetup = () => {
  const { toast } = useToast();
  const [itemMasters, setItemMasters] = useState<ItemMaster[]>([]);
  const [initialStocks, setInitialStocks] = useState<InitialStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchItemMasters();
  }, []);

  const fetchItemMasters = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/item-master');
      if (response.ok) {
        const data = await response.json();
        setItemMasters(data);
        // Initialize stock entries for all items
        setInitialStocks(data.map((item: ItemMaster) => ({
          ItemMasterID: item.ItemMasterID,
          quantity: 0,
          notes: `Initial ${item.ItemDescription} stock count`
        })));
      }
    } catch (error) {
      console.error('Error fetching item masters:', error);
      toast({
        title: "Error",
        description: "Failed to load item masters",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    setInitialStocks(prev => 
      prev.map(stock => 
        stock.ItemMasterID === itemId 
          ? { ...stock, quantity: Math.max(0, quantity) }
          : stock
      )
    );
  };

  const updateNotes = (itemId: number, notes: string) => {
    setInitialStocks(prev => 
      prev.map(stock => 
        stock.ItemMasterID === itemId 
          ? { ...stock, notes }
          : stock
      )
    );
  };

  const saveInitialInventory = async () => {
    setSaving(true);
    try {
      // Filter out items with zero quantity
      const validStocks = initialStocks.filter(stock => stock.quantity > 0);
      
      if (validStocks.length === 0) {
        toast({
          title: "Warning",
          description: "Please enter quantities for at least one item",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch('http://localhost:3001/api/inventory/initial-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initialStocks: validStocks,
          setupDate: new Date(),
          setupBy: 'System Administrator'
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Initial inventory setup completed for ${validStocks.length} items`,
        });
      } else {
        throw new Error('Failed to save initial inventory');
      }
    } catch (error) {
      console.error('Error saving initial inventory:', error);
      toast({
        title: "Error",
        description: "Failed to save initial inventory setup",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const totalItems = initialStocks.filter(stock => stock.quantity > 0).length;
  const totalQuantity = initialStocks.reduce((sum, stock) => sum + stock.quantity, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-100 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Package className="h-6 w-6" />
            Initial Inventory Setup
          </CardTitle>
          <CardDescription className="text-blue-600">
            Set up your starting inventory quantities. This will establish the baseline for all future stock movements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <Badge variant="outline" className="text-blue-600 border-blue-300">
              {totalItems} items with stock
            </Badge>
            <Badge variant="outline" className="text-green-600 border-green-300">
              {totalQuantity} total units
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {itemMasters.map((item) => {
          const stock = initialStocks.find(s => s.ItemMasterID === item.ItemMasterID);
          return (
            <Card key={item.ItemMasterID} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{item.ItemDescription}</CardTitle>
                    <CardDescription>
                      Unit: {item.Unit} | Category: {item.Category}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Min: {item.MinimumLevel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor={`qty-${item.ItemMasterID}`}>Initial Quantity</Label>
                  <Input
                    id={`qty-${item.ItemMasterID}`}
                    type="number"
                    min="0"
                    value={stock?.quantity || 0}
                    onChange={(e) => updateQuantity(item.ItemMasterID, parseInt(e.target.value) || 0)}
                    placeholder="Enter starting quantity"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`notes-${item.ItemMasterID}`}>Notes</Label>
                  <Input
                    id={`notes-${item.ItemMasterID}`}
                    value={stock?.notes || ''}
                    onChange={(e) => updateNotes(item.ItemMasterID, e.target.value)}
                    placeholder="Optional notes about this stock"
                    className="mt-1"
                  />
                </div>
                {stock && stock.quantity < item.MinimumLevel && stock.quantity > 0 && (
                  <div className="flex items-center gap-2 text-amber-600 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    Below minimum level
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Save Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Ready to initialize inventory with {totalItems} items and {totalQuantity} total units
            </div>
            <Button 
              onClick={saveInitialInventory}
              disabled={saving || totalItems === 0}
              className="flex items-center gap-2"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? 'Saving...' : 'Initialize Inventory'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InitialInventorySetup;
