
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateTenderRequest } from '@/types/tender';
import { useVendorManagement, useFileUpload } from '@/hooks/useFormCommon';
import { useVendors } from '@/hooks/useVendors';
import BasicDetailsSection from './shared/BasicDetailsSection';
import ItemMasterItemsSection from './shared/ItemMasterItemsSection';
import VendorSection from './shared/VendorSection';

const contractTenderFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  referenceNumber: z.string().min(1, "Reference number is required"),
  description: z.string().optional(),
  estimatedValue: z.number().min(0, "Estimated value must be positive"),
  publishDate: z.date(),
  publicationDate: z.date(),
  submissionDate: z.date(),
  submissionDeadline: z.date(),
  openingDate: z.date(),
  eligibilityCriteria: z.string().optional(),
  officeIds: z.array(z.string()).min(1, "At least one office is required"),
  wingIds: z.array(z.string()).min(1, "At least one wing is required"),
  decIds: z.array(z.string()).optional(),
  items: z.array(z.object({
    itemMasterId: z.string().min(1, "Item is required"),
    nomenclature: z.string().min(1, "Nomenclature is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    estimatedUnitPrice: z.number().min(0, "Unit price must be positive"),
    specifications: z.string().optional(),
    remarks: z.string().optional(),
  })).min(1, "At least one item is required"),
  selectedVendorId: z.string().optional(),
  vendor: z.object({
    vendorId: z.string().optional(),
    vendorName: z.string().optional(),
    contactPerson: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    contractValue: z.number().optional(),
    contractDate: z.date().optional(),
    remarks: z.string().optional(),
  }).optional(),
  // File upload fields
  rfpFile: z.any().optional(),
  contractCopyFile: z.any().optional(),
});

type ContractTenderFormValues = z.infer<typeof contractTenderFormSchema>;

interface TenderFormProps {
  onSubmit: (values: CreateTenderRequest) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  initialData?: Partial<CreateTenderRequest>;
}

const TenderForm: React.FC<TenderFormProps> = ({ 
  onSubmit, 
  onCancel, 
  isLoading, 
  initialData 
}) => {
  const { showVendorForm, selectedVendorId, handleVendorSelection } = useVendorManagement();
  const { handleFileUpload } = useFileUpload();
  const { vendors, loading: isLoadingVendors } = useVendors();

  const getFormDefaultValues = () => {
    if (initialData) {
      return {
        title: initialData.title || '',
        referenceNumber: initialData.referenceNumber || '',
        description: initialData.description || '',
        estimatedValue: initialData.estimatedValue || 0,
        publishDate: initialData.publishDate ? new Date(initialData.publishDate) : new Date(),
        publicationDate: initialData.publicationDate ? new Date(initialData.publicationDate) : new Date(),
        submissionDate: initialData.submissionDate ? new Date(initialData.submissionDate) : new Date(),
        submissionDeadline: initialData.submissionDeadline ? new Date(initialData.submissionDeadline) : new Date(),
        openingDate: initialData.openingDate ? new Date(initialData.openingDate) : new Date(),
        eligibilityCriteria: initialData.eligibilityCriteria || '',
        officeIds: initialData.officeIds || [],
        wingIds: initialData.wingIds || [],
        decIds: initialData.decIds || [],
        items: initialData.items?.map(item => ({
          itemMasterId: item.itemMasterId,
          nomenclature: item.nomenclature,
          quantity: item.quantity,
          estimatedUnitPrice: item.estimatedUnitPrice,
          specifications: item.specifications || '',
          remarks: item.remarks || '',
        })) || [],
        selectedVendorId: initialData.vendor?.vendorId || '',
        vendor: initialData.vendor ? {
          vendorId: initialData.vendor.vendorId || '',
          vendorName: initialData.vendor.vendorName || '',
          contactPerson: initialData.vendor.contactPerson || '',
          email: initialData.vendor.email || '',
          phone: initialData.vendor.phone || '',
          address: initialData.vendor.address || '',
          contractValue: initialData.vendor.contractValue || 0,
          contractDate: initialData.vendor.contractDate ? new Date(initialData.vendor.contractDate) : new Date(),
          remarks: initialData.vendor.remarks || '',
        } : {
          vendorId: '',
          vendorName: '',
          contactPerson: '',
          email: '',
          phone: '',
          address: '',
          contractValue: 0,
          contractDate: new Date(),
          remarks: '',
        },
        rfpFile: undefined,
        contractCopyFile: undefined,
      };
    }
    
    return {
      title: '',
      referenceNumber: '',
      description: '',
      estimatedValue: 0,
      publishDate: new Date(),
      publicationDate: new Date(),
      submissionDate: new Date(),
      submissionDeadline: new Date(),
      openingDate: new Date(),
      eligibilityCriteria: '',
      officeIds: [],
      wingIds: [],
      decIds: [],
      wingId: undefined,
      decId: undefined,
      items: [],
      selectedVendorId: '',
      vendor: {
        vendorId: '',
        vendorName: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        contractValue: 0,
        contractDate: new Date(),
        remarks: '',
      },
      rfpFile: undefined,
      contractCopyFile: undefined,
    };
  };

  const form = useForm<ContractTenderFormValues>({
    resolver: zodResolver(contractTenderFormSchema),
    defaultValues: getFormDefaultValues(),
    mode: "onChange",
  });

  useEffect(() => {
    if (initialData && initialData.items && initialData.items.length > 0) {
      form.reset(getFormDefaultValues());
    }
  }, [initialData, form]);

  const handleSubmit = (values: ContractTenderFormValues) => {
    console.log('🔍 DEBUG TENDER FORM SUBMIT:');
    console.log('  - Form values:', values);
    console.log('  - selectedVendorId:', values.selectedVendorId);
    console.log('  - vendor object:', values.vendor);
    
    const tenderRequest: CreateTenderRequest = {
      tender_spot_type: 'Contract/Tender',
      type: 'Contract/Tender',
      title: values.title,
      referenceNumber: values.referenceNumber,
      description: values.description,
      estimatedValue: values.estimatedValue,
      publishDate: values.publishDate.toISOString(),
      publicationDate: values.publicationDate.toISOString(),
      submissionDate: values.submissionDate.toISOString(),
      submissionDeadline: values.submissionDeadline.toISOString(),
      openingDate: values.openingDate.toISOString(),
      eligibilityCriteria: values.eligibilityCriteria,
      officeIds: values.officeIds,
      wingIds: values.wingIds,
      decIds: values.decIds,
      items: values.items.map(item => ({
        itemMasterId: item.itemMasterId,
        nomenclature: item.nomenclature,
        quantity: item.quantity,
        estimatedUnitPrice: item.estimatedUnitPrice,
        specifications: item.specifications,
        remarks: item.remarks,
      })),
      // Include vendor_id if an existing vendor is selected
      vendor_id: values.selectedVendorId && values.selectedVendorId !== 'add-new' && values.selectedVendorId !== 'none' ? values.selectedVendorId : undefined,
      // Include vendor object only if adding a new vendor
      vendor: values.selectedVendorId === 'add-new' ? {
        vendorId: '',
        vendorName: values.vendor?.vendorName || '',
        contactPerson: values.vendor?.contactPerson || '',
        email: values.vendor?.email || '',
        phone: values.vendor?.phone || '',
        address: values.vendor?.address || '',
        contractValue: values.vendor?.contractValue || 0,
        contractDate: values.vendor?.contractDate?.toISOString() || '',
        remarks: values.vendor?.remarks || '',
      } : undefined,
    };
    
    console.log('🔍 DEBUG FINAL TENDER REQUEST:');
    console.log('  - vendor_id in request:', tenderRequest.vendor_id);
    console.log('  - vendor object in request:', tenderRequest.vendor);
    console.log('  - Full request:', tenderRequest);
    
    onSubmit(tenderRequest);
  };

  const onVendorSelectionWrapper = (vendorId: string) => {
    handleVendorSelection(vendorId, form);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <BasicDetailsSection 
        form={form} 
        isLoading={isLoading} 
        initialData={initialData}
        showOfficeHierarchy={true}
      />
      
      <VendorSection 
        form={form} 
        isLoading={isLoading || isLoadingVendors} 
        initialData={initialData}
        showVendorForm={showVendorForm}
        selectedVendorId={selectedVendorId}
        onVendorSelection={onVendorSelectionWrapper}
        vendors={vendors}
      />

      <Card>
        <CardHeader>
          <CardTitle>Document Uploads</CardTitle>
          <CardDescription>Upload required documents for the tender.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* RFP Upload */}
            <div className="space-y-2">
              <Label htmlFor="rfpFile">RFP Document</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
                <Input
                  id="rfpFile"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e, 'rfpFile', form)}
                  disabled={isLoading}
                  className="hidden"
                />
                <label htmlFor="rfpFile" className="cursor-pointer flex flex-col items-center space-y-2">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600">Upload RFP Document</span>
                    <p className="text-xs mt-1">PDF, DOC, DOCX, JPG, PNG (max 10MB)</p>
                  </div>
                </label>
                {form.watch('rfpFile') && (
                  <div className="mt-2 flex items-center justify-center space-x-2 text-sm text-green-600">
                    <FileText className="h-4 w-4" />
                    <span>{(form.watch('rfpFile') as File)?.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contract Copy Upload */}
            <div className="space-y-2">
              <Label htmlFor="contractCopyFile">Contract Copy</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
                <Input
                  id="contractCopyFile"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e, 'contractCopyFile', form)}
                  disabled={isLoading}
                  className="hidden"
                />
                <label htmlFor="contractCopyFile" className="cursor-pointer flex flex-col items-center space-y-2">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600">Upload Contract Copy</span>
                    <p className="text-xs mt-1">PDF, DOC, DOCX, JPG, PNG (max 10MB)</p>
                  </div>
                </label>
                {form.watch('contractCopyFile') && (
                  <div className="mt-2 flex items-center justify-center space-x-2 text-sm text-green-600">
                    <FileText className="h-4 w-4" />
                    <span>{(form.watch('contractCopyFile') as File)?.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ItemMasterItemsSection form={form} isLoading={isLoading} />

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading || !form.formState.isValid}>
          {isLoading ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </form>
  );
};

export default TenderForm;
