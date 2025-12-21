'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useEffect } from 'react';
import { PottersWheelSpinner } from '../shared/PottersWheelSpinner';

const settingsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  companyAddress: z.string().min(1, 'Company address is required'),
  gstin: z.string().optional(),
  invoiceLogoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
});

export type CompanySettingsFormValues = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  onSubmit: (data: CompanySettingsFormValues) => void;
  settings: CompanySettingsFormValues & { id?: string } | null;
}

export function SettingsForm({ onSubmit, settings }: SettingsFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CompanySettingsFormValues>({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  const handleFormSubmit: SubmitHandler<CompanySettingsFormValues> = (data) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="max-w-2xl space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Company Details</h3>
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input id="companyName" {...register('companyName')} />
          {errors.companyName && <p className="text-sm text-destructive">{errors.companyName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyAddress">Company Address</Label>
          <Textarea id="companyAddress" {...register('companyAddress')} rows={3} />
          {errors.companyAddress && <p className="text-sm text-destructive">{errors.companyAddress.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="gstin">GSTIN</Label>
          <Input id="gstin" {...register('gstin')} />
          {errors.gstin && <p className="text-sm text-destructive">{errors.gstin.message}</p>}
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Invoice Settings</h3>
        <div className="space-y-2">
          <Label htmlFor="invoiceLogoUrl">Invoice Logo URL</Label>
          <Input id="invoiceLogoUrl" {...register('invoiceLogoUrl')} placeholder="https://..." />
          {errors.invoiceLogoUrl && <p className="text-sm text-destructive">{errors.invoiceLogoUrl.message}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Bank Details</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input id="bankName" {...register('bankName')} />
                {errors.bankName && <p className="text-sm text-destructive">{errors.bankName.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input id="ifscCode" {...register('ifscCode')} />
                {errors.ifscCode && <p className="text-xs text-destructive">{errors.ifscCode.message}</p>}
            </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input id="accountNumber" {...register('accountNumber')} />
            {errors.accountNumber && <p className="text-sm text-destructive">{errors.accountNumber.message}</p>}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? <PottersWheelSpinner /> : 'Save Settings'}
        </Button>
      </div>
    </form>
  );
}
