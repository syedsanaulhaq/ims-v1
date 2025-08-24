import React, { useEffect, useState } from 'react';
// (removed duplicate import)
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { CreateTenderRequest } from '@/types/tender';
import BasicDetailsSection from './shared/BasicDetailsSection';
import ItemMasterItemsSection from './shared/ItemMasterItemsSection';
import LoadingSpinner from "@/components/common/LoadingSpinner";
import VendorCombobox from "@/components/common/VendorCombobox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import VendorForm from "@/components/vendors/VendorForm";
import { Plus } from "lucide-react";
import { useVendors } from '@/hooks/useVendors';
import { useVendorManagement } from '@/hooks/useFormCommon';
import { useSession } from '@/contexts/SessionContext';

// Unified schema for both Contract/Tender and Spot Purchase
const contractTenderFormSchema = z.object({
  tender_id: z.string().optional(), // Add tender_id for edit mode and DB
  tender_spot_type: z.enum(['Contract/Tender', 'Spot Purchase'], { required_error: 'Type is required' }),
  title: z.string().min(1, "Title is required"),
  referenceNumber: z.string().min(1, "Reference number is required"),
  description: z.string().optional(),
  estimatedValue: z.coerce.number().min(0, "Estimated value must be positive"),
  publishDate: z.date({ required_error: "Publish date is required" }),
  submissionDate: z.date({ required_error: "Submission date is required" }),
  openingDate: z.date({ required_error: "Opening date is required" }),
  eligibilityCriteria: z.string().optional(),
  officeIds: z.array(z.string()).min(1, "At least one office is required"),
  wingIds: z.array(z.string()).min(1, "At least one wing is required"),
  decIds: z.array(z.string()).optional(),
  items: z.array(z.object({
    itemMasterId: z.string().min(1, "Item is required"),
    nomenclature: z.string().min(1, "Nomenclature is required"),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
    estimatedUnitPrice: z.coerce.number().min(0, "Unit price must be positive"),
    specifications: z.string().optional(),
    remarks: z.string().optional(),
  })).min(1, "At least one item is required"),
  vendor_id: z.string().optional(),
  vendor_name: z.string().optional(),
  rfpFile: z.any().optional(),
  contractFile: z.any().optional(),
  loiFile: z.any().optional(),
  purchaseOrderFile: z.any().optional(),
  notingFile: z.any().optional(),
  advertisementDate: z.date().optional(),
  publicationDailies: z.string().optional(),
  procurementMethod: z.string().optional(),
  biddingProcedure: z.string().optional(),
  status: z.string().min(1, "Status is required"), // Main status field for finalization logic
  tender_status: z.string().min(1, "Tender Status is required"), // for tender_status in DB
}).refine((data) => {
  // For Contract/Tender, biddingProcedure is required if procurementMethod is Open Competitive Bidding
  if (data.tender_spot_type === 'Contract/Tender' && data.procurementMethod === 'Open Competitive Bidding' && !data.biddingProcedure) {
    return false;
  }
  return true;
}, {
  message: "Procedure Adopted is required for Open Competitive Bidding",
  path: ["biddingProcedure"],
});

type ContractTenderFormValues = z.infer<typeof contractTenderFormSchema>;

interface ContractTenderFormProps {
  onSubmit: (values: CreateTenderRequest) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  initialData?: Partial<CreateTenderRequest>;
}

const ContractTenderForm: React.FC<ContractTenderFormProps> = ({
  onSubmit,
  onCancel,
  isLoading,
  initialData
}) => {
  const { getCurrentUserId, getCurrentUserName } = useSession();
  
  // Check if record is finalized (status = "Finalized")
  const isFinalized = initialData?.is_finalized === true;
  const isReadOnly = isFinalized;
  
  // State to hold uploaded file paths, initialize from initialData if present
  const [uploadedRfpPath, setUploadedRfpPath] = useState<string | undefined>(initialData?.rfp_file_path || undefined);
  const [uploadedContractPath, setUploadedContractPath] = useState<string | undefined>(initialData?.contract_file_path || undefined);
  const [uploadedLoiPath, setUploadedLoiPath] = useState<string | undefined>(initialData?.loi_file_path || undefined);
  const [uploadedPoPath, setUploadedPoPath] = useState<string | undefined>(initialData?.po_file_path || undefined);
  const [uploadedNotingPath, setUploadedNotingPath] = useState<string | undefined>(initialData?.noting_file_path || undefined);

  // Keep uploaded file path state in sync with initialData (for edit mode)
  useEffect(() => {
    setUploadedRfpPath(initialData?.rfp_file_path || undefined);
    setUploadedContractPath(initialData?.contract_file_path || undefined);
    setUploadedLoiPath(initialData?.loi_file_path || undefined);
    setUploadedPoPath(initialData?.po_file_path || undefined);
    setUploadedNotingPath(initialData?.noting_file_path || undefined);
  }, [initialData?.rfp_file_path, initialData?.contract_file_path, initialData?.loi_file_path, initialData?.po_file_path, initialData?.noting_file_path]);
  // Vendor dialog state
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [vendorFormLoading, setVendorFormLoading] = useState(false);
  const [vendorFormError, setVendorFormError] = useState<string | null>(null);
  // ...existing code...
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = React.useState(false);

  // Ensure vendors is always an array
  const safeVendors = []; // Array.isArray(vendors) ? vendors : [];

  // Removed debug logging for vendors

  // Always default to 'Tenders' unless explicitly set (for open form)
  const form = useForm<ContractTenderFormValues>({
    resolver: zodResolver(contractTenderFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      tender_spot_type: typeof initialData?.tender_spot_type === 'string' && ['Contract/Tender', 'Spot Purchase'].includes(initialData.tender_spot_type)
        ? initialData.tender_spot_type
        : 'Contract/Tender',
      title: initialData?.title || '',
      referenceNumber: initialData?.referenceNumber || '',
      description: initialData?.description || '',
      estimatedValue: initialData?.estimatedValue || 0,
      publishDate: initialData?.publishDate ? new Date(initialData.publishDate) : new Date(),
      submissionDate: initialData?.submissionDate ? new Date(initialData.submissionDate) : new Date(),
      openingDate: initialData?.openingDate ? new Date(initialData.openingDate) : new Date(),
      eligibilityCriteria: initialData?.eligibilityCriteria || '',
      officeIds: initialData?.officeIds || [],
      wingIds: initialData?.wingIds || [],
      decIds: initialData?.decIds || [],
      items: initialData?.items?.map(item => ({
        itemMasterId: item.itemMasterId || '',
        nomenclature: item.nomenclature || '',
        quantity: item.quantity || 1,
        estimatedUnitPrice: item.estimatedUnitPrice || 0,
        specifications: item.specifications || '',
        remarks: item.remarks || '',
      })) || [],
      // Use vendor_id, status and tender_status directly from initialData (DB fields)
      vendor_id: initialData?.vendor_id || '',
      vendor_name: initialData?.vendor?.vendorName || '',
      status: initialData?.status || 'Draft', // Main status field for finalization logic
      tender_status: initialData?.tender_status || 'Draft', // Default to Draft for new tenders
      tender_id: initialData?.tender_id ?? '',
      rfpFile: undefined,
      contractFile: undefined,
      loiFile: undefined,
      purchaseOrderFile: undefined,
      notingFile: undefined,
      advertisementDate: initialData?.advertisementDate ? new Date(initialData.advertisementDate) : new Date(),
      publicationDailies: initialData?.publicationDailies || '',
      procurementMethod: initialData?.procurementMethod || '',
      biddingProcedure: initialData?.biddingProcedure || '',
    },
  });

  // Clear biddingProcedure when procurement method changes away from "Open Competitive Bidding"
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'procurementMethod' && value.procurementMethod !== 'Open Competitive Bidding') {
        form.setValue('biddingProcedure', '');
      }
      // When switching between Contract/Tender and Spot Purchase, clear/hide fields as needed
      if (name === 'tender_spot_type') {
        if (value.tender_spot_type === 'Spot Purchase') {
          form.setValue('rfpFile', undefined);
          form.setValue('contractFile', undefined);
          form.setValue('loiFile', undefined);
          form.setValue('purchaseOrderFile', undefined);
          form.setValue('advertisementDate', undefined);
          form.setValue('publicationDailies', '');
          form.setValue('procurementMethod', '');
          form.setValue('biddingProcedure', '');
          // form.setValue('tender_status', ''); // removed as tender_status is no longer in schema
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Reset form when initialData changes (e.g., switching from edit to add mode)
  useEffect(() => {
    const resetValues = {
      tender_spot_type: typeof initialData?.tender_spot_type === 'string' && ['Contract/Tender', 'Spot Purchase'].includes(initialData.tender_spot_type)
        ? initialData.tender_spot_type
        : 'Contract/Tender',
      title: initialData?.title || '',
      referenceNumber: initialData?.referenceNumber || '',
      description: initialData?.description || '',
      estimatedValue: initialData?.estimatedValue || 0,
      publishDate: initialData?.publishDate ? new Date(initialData.publishDate) : new Date(),
      submissionDate: initialData?.submissionDate ? new Date(initialData.submissionDate) : new Date(),
      openingDate: initialData?.openingDate ? new Date(initialData.openingDate) : new Date(),
      eligibilityCriteria: initialData?.eligibilityCriteria || '',
      officeIds: initialData?.officeIds || [],
      wingIds: initialData?.wingIds || [],
      decIds: initialData?.decIds || [],
      items: initialData?.items?.map(item => ({
        itemMasterId: item.itemMasterId || '',
        nomenclature: item.nomenclature || '',
        quantity: item.quantity || 1,
        estimatedUnitPrice: item.estimatedUnitPrice || 0,
        specifications: item.specifications || '',
        remarks: item.remarks || '',
      })) || [],
      vendor_id: initialData?.vendor_id || '',
      vendor_name: initialData?.vendor?.vendorName || '',
      tender_id: initialData?.tender_id ?? '',
      rfpFile: undefined,
      contractFile: undefined,
      loiFile: undefined,
      purchaseOrderFile: undefined,
      notingFile: undefined,
      advertisementDate: initialData?.advertisementDate ? new Date(initialData.advertisementDate) : new Date(),
      publicationDailies: initialData?.publicationDailies || '',
      procurementMethod: initialData?.procurementMethod || '',
      biddingProcedure: initialData?.biddingProcedure || '',
      status: (typeof initialData?.status !== 'undefined' && initialData?.status !== null && initialData?.status !== '')
        ? String(initialData.status)
        : 'Draft',
      tender_status: (typeof initialData?.tender_status !== 'undefined' && initialData?.tender_status !== null && initialData?.tender_status !== '')
        ? String(initialData.tender_status)
        : 'Open',
    };
    // Debug: log what is being set for vendor_id and tender_status
    // Debug log for vendor_id and tender_status removed
    form.reset(resetValues);
    setHasAttemptedSubmit(false); // Reset validation alert when form is reset
  }, [initialData, form]);

  // Upload file to backend and set the returned path
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        form.setError(fieldName as any, { type: 'manual', message: 'File size must be less than 50MB' });
        return;
      }
      form.clearErrors(fieldName as any);
      form.setValue(fieldName as any, file);
      // Upload to backend
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('http://localhost:3001/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.filePath) {
          if (fieldName === 'rfpFile') setUploadedRfpPath(data.filePath);
          if (fieldName === 'contractFile') setUploadedContractPath(data.filePath);
          if (fieldName === 'loiFile') setUploadedLoiPath(data.filePath);
          if (fieldName === 'purchaseOrderFile') setUploadedPoPath(data.filePath);
          if (fieldName === 'notingFile') setUploadedNotingPath(data.filePath);
        } else {
          form.setError(fieldName as any, { type: 'manual', message: 'File upload failed' });
        }
      } catch (err) {
        form.setError(fieldName as any, { type: 'manual', message: 'File upload failed' });
      }
    }
  };

  // Helper to get local file URL
  function getLocalFileUrl(path?: string) {
    if (!path) return undefined;
    // Only rewrite if not already a full URL
    if (path.startsWith('http')) return path;
    return `http://localhost:3001/uploads/${path}`;
  }

  // Always use the watched value for tender_spot_type to ensure correct type is submitted
  const watchedType = form.watch('tender_spot_type');
  const handleSubmit = async (values: ContractTenderFormValues) => {
    setHasAttemptedSubmit(true);
    try {
      // Map form fields to backend field names (snake_case where needed)
      const tenderRequest: CreateTenderRequest = {
        ...values,
        created_by: getCurrentUserId(), // Use session user ID
        tender_spot_type: watchedType,
        type: watchedType, // for backend compatibility if needed
        title: values.title,
        referenceNumber: values.referenceNumber,
        description: values.description || '',
        estimatedValue: Number(values.estimatedValue),
        publishDate: values.publishDate.toISOString().split('T')[0],
        publicationDate: values.publishDate.toISOString().split('T')[0],
        submissionDate: values.submissionDate.toISOString().split('T')[0],
        submissionDeadline: values.submissionDate.toISOString().split('T')[0],
        openingDate: values.openingDate.toISOString().split('T')[0],
        eligibilityCriteria: values.eligibilityCriteria || '',
        officeIds: values.officeIds,
        wingIds: values.wingIds,
        decIds: values.decIds,
        items: values.items.map(item => ({
          itemMasterId: item.itemMasterId,
          nomenclature: item.nomenclature,
          quantity: Number(item.quantity),
          estimatedUnitPrice: Number(item.estimatedUnitPrice),
          specifications: item.specifications || '',
          remarks: item.remarks || '',
        })),
        vendor: values.vendor_id ? { vendorId: values.vendor_id, vendorName: values.vendor_name || '' } : undefined,
        procurementMethod: values.procurementMethod,
        biddingProcedure: values.biddingProcedure,
        advertisementDate: values.advertisementDate instanceof Date ? values.advertisementDate.toISOString().split('T')[0] : values.advertisementDate,
        publicationDailies: values.publicationDailies,
        status: values.status, // Main status field for finalization logic
        tender_status: values.tender_status, // Business workflow status field
        tender_id: values.tender_id, // <-- include tender_id for update/edit
        // Attach uploaded file paths for DB
        rfp_file_path: uploadedRfpPath,
        contract_file_path: uploadedContractPath,
        loi_file_path: uploadedLoiPath,
        po_file_path: uploadedPoPath,
        noting_file_path: uploadedNotingPath,
      };

      // Remove UI-only fields from payload if present
      // vendor field deletion retained if needed elsewhere
      // Remove legacy fields if present
      await onSubmit(tenderRequest);
      setHasAttemptedSubmit(false);
    } catch (error) {
      
      throw error;
    }
  };

  const formValues = form.watch();
  const formErrors = form.formState.errors;
  const isFormValid = form.formState.isValid;

  // Check if form can be submitted
  const canSubmit = () => {
    const hasRequiredFields = 
      formValues.title?.trim() &&
      formValues.referenceNumber?.trim() &&
      formValues.estimatedValue >= 0 &&
      formValues.officeIds?.length > 0 &&
      formValues.wingIds?.length > 0 &&
      formValues.items?.length > 0 &&
      formValues.publishDate &&
      formValues.submissionDate &&
      formValues.openingDate;

    const hasValidItems = formValues.items?.every(item => 
      item.itemMasterId?.trim() && 
      item.nomenclature?.trim() && 
      item.quantity > 0 && 
      item.estimatedUnitPrice >= 0
    );

    // Filter out file upload errors since file uploads are optional
    const nonFileErrors = Object.entries(formErrors).filter(([key, error]) => {
      const fileFields = ['rfpFile', 'contractFile', 'loiFile', 'purchaseOrderFile', 'notingFile'];
      return !fileFields.includes(key) || (error.type !== 'manual' || error.message !== 'File upload failed');
    });

    const canSubmitResult = hasRequiredFields && hasValidItems && nonFileErrors.length === 0;

    return canSubmitResult;
  };

  // Function to get missing required fields
  const getMissingRequiredFields = () => {
    const missing = [];
    
    if (!formValues.title?.trim()) missing.push({ field: 'title', label: 'Title' });
    if (!formValues.referenceNumber?.trim()) missing.push({ field: 'referenceNumber', label: 'Reference Number' });
    if (!formValues.estimatedValue || formValues.estimatedValue <= 0) missing.push({ field: 'estimatedValue', label: 'Estimated Value' });
    if (!formValues.officeIds?.length) missing.push({ field: 'officeIds', label: 'Office Selection' });
    if (!formValues.wingIds?.length) missing.push({ field: 'wingIds', label: 'Wing Selection' });
    if (!formValues.publishDate) missing.push({ field: 'publishDate', label: 'Publish Date' });
    if (!formValues.submissionDate) missing.push({ field: 'submissionDate', label: 'Submission Date' });
    if (!formValues.openingDate) missing.push({ field: 'openingDate', label: 'Opening Date' });
    if (!formValues.items?.length) missing.push({ field: 'items', label: 'Items (at least one item)' });
    
    // Check if items have required fields
    if (formValues.items?.length > 0) {
      formValues.items.forEach((item, index) => {
        if (!item.itemMasterId?.trim()) missing.push({ field: `items.${index}.itemMasterId`, label: `Item ${index + 1} - Item Selection` });
        if (!item.nomenclature?.trim()) missing.push({ field: `items.${index}.nomenclature`, label: `Item ${index + 1} - Nomenclature` });
        if (!item.quantity || item.quantity <= 0) missing.push({ field: `items.${index}.quantity`, label: `Item ${index + 1} - Quantity` });
        if (!item.estimatedUnitPrice || item.estimatedUnitPrice < 0) missing.push({ field: `items.${index}.estimatedUnitPrice`, label: `Item ${index + 1} - Unit Price` });
      });
    }
    
    return missing;
  };

  // Function to focus on first missing field
  const focusOnFirstMissingField = () => {
    const missing = getMissingRequiredFields();
    if (missing.length > 0) {
      const firstMissingField = missing[0].field;
      
      setTimeout(() => {
        let element: HTMLElement | null = null;
        
        // Try to find the element using multiple strategies
        element = document.querySelector(`[name="${firstMissingField}"]`) as HTMLElement ||
                 document.querySelector(`#${firstMissingField}`) as HTMLElement ||
                 document.querySelector(`[data-field="${firstMissingField}"]`) as HTMLElement;
        
        // Handle special cases for complex fields
        if (!element) {
          if (firstMissingField === 'officeIds') {
            element = document.querySelector('[data-field="officeIds"] button, [data-testid="office-multiselect"], input[placeholder*="office"], button[role="combobox"]') as HTMLElement;
          } else if (firstMissingField === 'wingIds') {
            element = document.querySelector('[data-field="wingIds"] button, [data-testid="wing-multiselect"], input[placeholder*="wing"]') as HTMLElement;
          } else if (firstMissingField === 'items') {
            element = document.querySelector('[data-testid="items-section"], [data-field="items"]') as HTMLElement;
          } else if (firstMissingField.startsWith('items.')) {
            const itemIndex = firstMissingField.split('.')[1];
            element = document.querySelector(`[data-testid="item-${itemIndex}"], .item-row:nth-child(${parseInt(itemIndex) + 1})`) as HTMLElement;
          }
        }
        
        // Fallback to label-based search
        if (!element) {
          const labelText = missing[0].label.toLowerCase();
          const labels = Array.from(document.querySelectorAll('label'));
          const matchingLabel = labels.find(label => {
            const text = label.textContent?.toLowerCase() || '';
            return text.includes(labelText.split(' ')[0]) || text.includes(labelText.split(' - ')[0]);
          });
          
          if (matchingLabel) {
            element = matchingLabel.parentElement?.querySelector('input, select, textarea, button[role="combobox"]') as HTMLElement;
          }
        }
        
        if (element) {
          element.focus();
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // For dropdowns and comboboxes, trigger click to open
          if (element.getAttribute('role') === 'combobox' || 
              element.classList.contains('select-trigger') ||
              element.tagName === 'BUTTON') {
            element.click();
          }
        } else {
          // Fallback: scroll to form top
          const formElement = document.querySelector('form');
          if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 150);
    }
  };

  // Handle form submission attempt (including validation failures)
  const handleFormSubmit = (e: React.FormEvent) => {
    setHasAttemptedSubmit(true);
    // Let react-hook-form handle the actual submission
  };

  const missingFields = getMissingRequiredFields();
  
  // Filter out file upload errors since file uploads are optional
  const nonFileErrors = Object.entries(formErrors).filter(([key, error]) => {
    const fileFields = ['rfpFile', 'contractFile', 'loiFile', 'purchaseOrderFile', 'notingFile'];
    return !fileFields.includes(key) || (error.type !== 'manual' || error.message !== 'File upload failed');
  });
  
  const hasErrors = nonFileErrors.length > 0;
  const shouldShowValidationAlert = hasAttemptedSubmit && (missingFields.length > 0 || hasErrors);

  const submitEnabled = canSubmit() && !isLoading;

  // Clear file upload errors on component mount since they're optional
  React.useEffect(() => {
    const fileFields = ['rfpFile', 'contractFile', 'loiFile', 'purchaseOrderFile', 'notingFile'];
    fileFields.forEach(field => {
      const error = formErrors[field as keyof typeof formErrors];
      if (error?.type === 'manual' && error?.message === 'File upload failed') {
        form.clearErrors(field as any);
      }
    });
  }, []);

  // Removed debug logging for form state

  // Show loading if vendors are still loading
  // if (isLoadingVendors) {
  //   return (
  //     <div className="p-6 flex items-center justify-center min-h-96">
  //       <div className="text-center">
  //         <LoadingSpinner size="lg" className="mx-auto mb-4" />
  //         <p className="text-gray-600">Loading form data...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // Helper to get heading/label text based on type
  // Always use the latest value for heading by watching the field directly in render
  const isSpotPurchase = watchedType === 'Spot Purchase';
  const getHeading = (tenderLabel: string, spotLabel: string) =>
    isSpotPurchase ? spotLabel : tenderLabel;
  const typeName = isSpotPurchase ? 'Spot Purchase' : 'Contract/Tender';

  // Only use Spot Purchase-specific headings/labels in Spot Purchase mode
  return (
    <Form {...form}>
      <h2 className="text-2xl font-bold mb-4 text-center">
        {isSpotPurchase ? 'Spot Purchase Form' : 'Tender Form'}
      </h2>
      
      {/* Finalization Warning */}
      {isFinalized && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-amber-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-amber-800 mb-1">Record is Finalized</h3>
              <p className="text-sm text-amber-700">
                This {typeName.toLowerCase()} has been finalized (status: Finalized) and cannot be modified or deleted. 
                All fields are read-only.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={(e) => {
        handleFormSubmit(e);
        form.handleSubmit(handleSubmit)(e);
      }} className="space-y-6">
        {/* Tender/Spot Type Selection */}
        <Card>
        <CardHeader>
          <CardTitle>{isSpotPurchase ? 'Spot Purchase Type' : 'Tender Type'}</CardTitle>
          <CardDescription>{isSpotPurchase ? 'Select the type for Spot Purchase' : 'Select the type for Tender'}</CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="tender_spot_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isSpotPurchase ? 'Spot Purchase Type' : 'Type'}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || isReadOnly} name="tender_spot_type">
                  <FormControl>
                    <SelectTrigger id="tender_spot_type_trigger">
                      <SelectValue placeholder={isSpotPurchase ? 'Select Spot Purchase Type' : 'Select type'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Contract/Tender" id="Contract/Tender">Contract/Tender</SelectItem>
                    <SelectItem value="Spot Purchase" id="Spot Purchase">Spot Purchase</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
        </Card>

        {/* Required Fields Validation Alert - Only show after submit attempt */}
        {shouldShowValidationAlert && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 mb-2">
                  Please complete the following required fields:
                </h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {missingFields.map((missing, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                      {missing.label}
                    </li>
                  ))}
                  {hasErrors && (
                    <li className="flex items-center text-red-600 font-medium">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                      Please fix validation errors in the form
                    </li>
                  )}
                </ul>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 text-red-700 border-red-300 hover:bg-red-100"
                  onClick={focusOnFirstMissingField}
                >
                  Go to {missingFields[0]?.label || 'first missing field'}
                </Button>
              </div>
            </div>
          </div>
        )}

        <BasicDetailsSection 
          form={form} 
          isLoading={isLoading}
          showOfficeHierarchy={true}
          showDepartment={false}
          showCategory={false}
          isSpotPurchase={isSpotPurchase}
          isReadOnly={isReadOnly}
        />

        {/* Vendor Selection Section */}
        <Card>
        <CardHeader>
          <CardTitle>{isSpotPurchase ? 'Spot Purchase Vendor Selection' : 'Tender Vendor Selection'}</CardTitle>
          <CardDescription>
            {isSpotPurchase ? 'Select the vendor for this spot purchase' : 'Select the vendor for this tender'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="vendor_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor</FormLabel>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <VendorCombobox
                      value={field.value}
                      onValueChange={(vendorId: string) => {
                        field.onChange(vendorId);
                      }}
                      disabled={isLoading || isReadOnly}
                      placeholder="Select vendor..."
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="ml-1"
                    title="Add New Vendor"
                    onClick={() => setVendorDialogOpen(true)}
                    disabled={isReadOnly}
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
                {form.watch('vendor_id') && form.watch('vendor_name') && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Selected: <span className="font-semibold">{form.watch('vendor_id')}</span> - {form.watch('vendor_name')}
                  </div>
                )}
                <FormMessage />
                {/* Vendor Add Dialog */}
                <Dialog open={vendorDialogOpen} onOpenChange={setVendorDialogOpen}>
                  <DialogContent className="max-w-2xl !fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 z-[9999] !h-[90vh] overflow-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Vendor</DialogTitle>
                    </DialogHeader>
                    <VendorForm
                      isLoading={vendorFormLoading}
                      onCancel={() => setVendorDialogOpen(false)}
                      onSubmit={async (data) => {
                        setVendorFormLoading(true);
                        setVendorFormError(null);
                        try {
                          // Call backend API to add vendor
                          const res = await fetch("http://localhost:3001/api/vendors", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(data),
                          });
                          if (!res.ok) throw new Error("Failed to add vendor");
                          const vendor = await res.json();
                          // Set vendor in form
                          form.setValue("vendor_id", vendor.id);
                          form.setValue("vendor_name", vendor.vendor_name);
                          setVendorDialogOpen(false);
                        } catch (err: any) {
                          setVendorFormError(err.message || "Failed to add vendor");
                        } finally {
                          setVendorFormLoading(false);
                        }
                      }}
                    />
                    {vendorFormError && (
                      <div className="text-red-600 text-sm mt-2">{vendorFormError}</div>
                    )}
                  </DialogContent>
                </Dialog>
              </FormItem>
            )}
          />
        </CardContent>
        </Card>

        {/* Document Uploads Section */}
        {!isSpotPurchase && (
          <Card>
            <CardHeader>
              <CardTitle>Tender Document Uploads</CardTitle>
              <CardDescription>Upload required documents for the tender.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {/* Show already uploaded files if editing and present */}
              {/* Show already uploaded files for each document type if present */}
              {(uploadedRfpPath || uploadedContractPath || uploadedLoiPath || uploadedPoPath || uploadedNotingPath) && (
                <div className="mb-4">
                  <div className="font-semibold mb-2">Already Uploaded Files:</div>
                  <ul className="space-y-1">
                    {uploadedRfpPath && (
                      <li>
                        <a href={getLocalFileUrl(uploadedRfpPath)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                          RFP Document
                        </a>
                      </li>
                    )}
                    {uploadedContractPath && (
                      <li>
                        <a href={getLocalFileUrl(uploadedContractPath)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                          Contract Document
                        </a>
                      </li>
                    )}
                    {uploadedLoiPath && (
                      <li>
                        <a href={getLocalFileUrl(uploadedLoiPath)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                          Letter of Intent (LoI)
                        </a>
                      </li>
                    )}
                    {uploadedPoPath && (
                      <li>
                        <a href={getLocalFileUrl(uploadedPoPath)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                          Purchase Order
                        </a>
                      </li>
                    )}
                    {uploadedNotingPath && (
                      <li>
                        <a href={getLocalFileUrl(uploadedNotingPath)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                          Noting
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* RFP Upload */}
                <div className="space-y-2">
                  <Label htmlFor="rfpFile">RFP</Label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
                    <Input
                      id="rfpFile"
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, 'rfpFile')}
                      disabled={isLoading}
                      className="hidden"
                    />
                    <label htmlFor="rfpFile" className="cursor-pointer flex flex-col items-center space-y-2">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-blue-600">Upload RFP</span>
                        <p className="text-xs mt-1">PDF, DOC, DOCX, JPG, PNG (max 50MB)</p>
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

                {/* Contract Upload */}
                <div className="space-y-2">
                  <Label htmlFor="contractFile">Contract</Label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
                    <Input
                      id="contractFile"
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, 'contractFile')}
                      disabled={isLoading}
                      className="hidden"
                    />
                    <label htmlFor="contractFile" className="cursor-pointer flex flex-col items-center space-y-2">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-blue-600">Upload Contract</span>
                        <p className="text-xs mt-1">PDF, DOC, DOCX, JPG, PNG (max 50MB)</p>
                      </div>
                    </label>
                    {form.watch('contractFile') && (
                      <div className="mt-2 flex items-center justify-center space-x-2 text-sm text-green-600">
                        <FileText className="h-4 w-4" />
                        <span>{(form.watch('contractFile') as File)?.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Letter of Intent Upload */}
                <div className="space-y-2">
                  <Label htmlFor="loiFile">Letter of Intent (LoI)</Label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
                    <Input
                      id="loiFile"
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, 'loiFile')}
                      disabled={isLoading}
                      className="hidden"
                    />
                    <label htmlFor="loiFile" className="cursor-pointer flex flex-col items-center space-y-2">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-blue-600">Upload LoI</span>
                        <p className="text-xs mt-1">PDF, DOC, DOCX, JPG, PNG (max 50MB)</p>
                      </div>
                    </label>
                    {form.watch('loiFile') && (
                      <div className="mt-2 flex items-center justify-center space-x-2 text-sm text-green-600">
                        <FileText className="h-4 w-4" />
                        <span>{(form.watch('loiFile') as File)?.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Purchase Order Upload */}
                <div className="space-y-2">
                  <Label htmlFor="purchaseOrderFile">Purchase Order</Label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
                    <Input
                      id="purchaseOrderFile"
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, 'purchaseOrderFile')}
                      disabled={isLoading}
                      className="hidden"
                    />
                    <label htmlFor="purchaseOrderFile" className="cursor-pointer flex flex-col items-center space-y-2">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-blue-600">Upload PO</span>
                        <p className="text-xs mt-1">PDF, DOC, DOCX, JPG, PNG (max 50MB)</p>
                      </div>
                    </label>
                    {form.watch('purchaseOrderFile') && (
                      <div className="mt-2 flex items-center justify-center space-x-2 text-sm text-green-600">
                        <FileText className="h-4 w-4" />
                        <span>{(form.watch('purchaseOrderFile') as File)?.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Noting Upload - Only for Spot Purchases */}
        {isSpotPurchase && (
          <Card>
            <CardHeader>
              <CardTitle>Noting Upload</CardTitle>
              <CardDescription>Upload Noting for Spot Purchase.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="notingFile">Noting</Label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
                  <Input
                    id="notingFile"
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, 'notingFile')}
                    disabled={isLoading}
                    className="hidden"
                  />
                  <label htmlFor="notingFile" className="cursor-pointer flex flex-col items-center space-y-2">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-blue-600">Upload Noting</span>
                      <p className="text-xs mt-1">PDF, DOC, DOCX, JPG, PNG (max 50MB)</p>
                    </div>
                  </label>
                  {form.watch('notingFile') && (
                    <div className="mt-2 flex items-center justify-center space-x-2 text-sm text-green-600">
                      <FileText className="h-4 w-4" />
                      <span>{(form.watch('notingFile') as File)?.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tender Process Details Section - Only for Tenders */}
        {!isSpotPurchase && (
          <Card>
          <CardHeader>
            <CardTitle>Tender Process Details</CardTitle>
            <CardDescription>Additional information about the tender process and status.</CardDescription>
          </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date of Advertisement/Publication */}
                <FormField
                  control={form.control}
                  name="advertisementDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Advertisement/Publication of Tender</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ? field.value.toISOString().split('T')[0] : ''}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Publication Dailies */}
                <FormField
                  control={form.control}
                  name="publicationDailies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publication Dailies (two)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Dawn, The News"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Procurement Method */}
                <FormField
                  control={form.control}
                  name="procurementMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Procurement Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select procurement method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Open Competitive Bidding">Open Competitive Bidding</SelectItem>
                          <SelectItem value="MoU">MoU</SelectItem>
                          <SelectItem value="Direct Contracting">Direct Contracting</SelectItem>
                          <SelectItem value="Limited Tendering">Limited Tendering</SelectItem>
                          <SelectItem value="Single Source">Single Source</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bidding Procedure - Only show for Open Competitive Bidding */}
                {form.watch('procurementMethod') === 'Open Competitive Bidding' && (
                  <FormField
                    control={form.control}
                    name="biddingProcedure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Procedure Adopted (for Open Competitive Bidding)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select bidding procedure" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Single Stage One Envelope">Single Stage One Envelope</SelectItem>
                            <SelectItem value="Single Stage Two Envelope">Single Stage Two Envelope</SelectItem>
                            <SelectItem value="Two Stage">Two Stage</SelectItem>
                            <SelectItem value="Two Stage Two Envelope">Two Stage Two Envelope</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="tender_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tender Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select tender status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Open">Open</SelectItem>
                          <SelectItem value="Closed">Closed</SelectItem>
                          <SelectItem value="Evaluated">Evaluated</SelectItem>
                          <SelectItem value="Awarded">Awarded</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <ItemMasterItemsSection 
          form={form} 
          isLoading={isLoading}
          isSpotPurchase={isSpotPurchase}
          isReadOnly={isReadOnly}
        />

        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          )}
          {!isFinalized && (
            <Button 
              type="submit" 
              disabled={!submitEnabled || isLoading}
              className="min-w-[140px]"
              title={!submitEnabled && missingFields.length > 0 ? `Missing required fields: ${missingFields.map(f => f.label).join(', ')}` : ''}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {initialData ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                <>
                  {isSpotPurchase ? (initialData ? 'Update Spot Purchase' : 'Submit Spot Purchase') : (initialData ? 'Update Tender' : 'Submit Tender')}
                  {!submitEnabled && missingFields.length > 0 && (
                    <span className="ml-2 text-xs">({missingFields.length} missing)</span>
                  )}
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};

export default ContractTenderForm;
