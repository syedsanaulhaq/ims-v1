import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { Building2, Users, MapPin, Check } from 'lucide-react';

const MultiSelectDemo = () => {
  const [selectedOffices, setSelectedOffices] = React.useState<string[]>([]);
  const [selectedWings, setSelectedWings] = React.useState<string[]>([]);
  const [selectedDecs, setSelectedDecs] = React.useState<string[]>([]);

  const officeOptions = [
    { label: "ECP Secretariat", value: "1", icon: Building2 },
    { label: "Human Resource (HR)", value: "2", icon: Building2 },
    { label: "DL & CP", value: "3", icon: Building2 },
    { label: "Estb-I", value: "4", icon: Building2 },
    { label: "Estb-II", value: "5", icon: Building2 },
  ];

  const wingOptions = [
    { label: "HR Wing Office", value: "1", icon: Users },
    { label: "HRMS", value: "2", icon: Users },
    { label: "LG-KP", value: "3", icon: Users },
    { label: "LG-Balochistan", value: "4", icon: Users },
  ];

  const decOptions = [
    { label: "DEC Islamabad (ISB)", value: "1", icon: MapPin },
    { label: "DEC Lahore (LHR)", value: "2", icon: MapPin },
    { label: "DEC Karachi (KHI)", value: "3", icon: MapPin },
    { label: "DEC Peshawar (PSH)", value: "4", icon: MapPin },
  ];

  const handleReset = () => {
    setSelectedOffices([]);
    setSelectedWings([]);
    setSelectedDecs([]);
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Multi-Select Office Hierarchy Demo
          </CardTitle>
          <CardDescription>
            This demo shows the new multi-select functionality for office hierarchy selection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Offices Multi-Select */}
          <div>
            <label className="text-sm font-medium mb-2 block">Select Offices</label>
            <MultiSelect
              options={officeOptions}
              onValueChange={setSelectedOffices}
              defaultValue={selectedOffices}
              placeholder="Select offices..."
              variant="secondary"
              animation={0.1}
              maxCount={3}
            />
          </div>

          {/* Wings Multi-Select */}
          <div>
            <label className="text-sm font-medium mb-2 block">Select Wings</label>
            <MultiSelect
              options={wingOptions}
              onValueChange={setSelectedWings}
              defaultValue={selectedWings}
              placeholder="Select wings..."
              variant="secondary"
              animation={0.1}
              maxCount={2}
            />
          </div>

          {/* DECs Multi-Select */}
          <div>
            <label className="text-sm font-medium mb-2 block">Select DECs</label>
            <MultiSelect
              options={decOptions}
              onValueChange={setSelectedDecs}
              defaultValue={selectedDecs}
              placeholder="Select DECs..."
              variant="secondary"
              animation={0.1}
              maxCount={2}
            />
          </div>

          {/* Selection Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Current Selection:</h4>
            <div className="text-sm space-y-1">
              <div>
                <strong>Offices:</strong> {
                  selectedOffices.length > 0 
                    ? selectedOffices.map(id => officeOptions.find(o => o.value === id)?.label).join(', ')
                    : 'None selected'
                }
              </div>
              <div>
                <strong>Wings:</strong> {
                  selectedWings.length > 0 
                    ? selectedWings.map(id => wingOptions.find(w => w.value === id)?.label).join(', ')
                    : 'None selected'
                }
              </div>
              <div>
                <strong>DECs:</strong> {
                  selectedDecs.length > 0 
                    ? selectedDecs.map(id => decOptions.find(d => d.value === id)?.label).join(', ')
                    : 'None selected'
                }
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleReset} variant="outline">
              Reset All
            </Button>
            <Button onClick={() => {
              setSelectedOffices(['1', '2']);
              setSelectedWings(['1', '3']);
              setSelectedDecs(['1', '2']);
            }} variant="default">
              Select Sample Data
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default MultiSelectDemo;
