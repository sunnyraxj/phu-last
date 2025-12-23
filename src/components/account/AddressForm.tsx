

'use client';

import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { useToast } from '@/hooks/use-toast';

const addressSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().length(6, 'Pincode must be 6 digits'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  addressType: z.enum(['Home', 'Work', 'Other']),
  isDefault: z.boolean().default(false),
});

export type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressFormProps {
  onSuccess: (data: AddressFormValues) => Promise<void>;
  onCancel: () => void;
  address: AddressFormValues & { id?: string } | null;
}

export function AddressForm({ onSuccess, onCancel, address }: AddressFormProps) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: address || {
      name: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      addressType: 'Home',
      isDefault: false,
    }
  });

  useEffect(() => {
    if (address) {
      reset(address);
    } else {
      reset({
        name: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        addressType: 'Home',
        isDefault: false,
      });
    }
  }, [address, reset]);

  const handleFormSubmit: SubmitHandler<AddressFormValues> = async (data) => {
    try {
      await onSuccess(data);
    } catch(e) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not save address. Please try again."
        });
    }
  };

  return (
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="space-y-4 my-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Input id="address" {...register('address')} />
            {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register('city')} />
              {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" {...register('state')} />
              {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input id="pincode" {...register('pincode')} />
              {errors.pincode && <p className="text-sm text-destructive">{errors.pincode.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" {...register('phone')} />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>
          </div>
           <div className="space-y-2">
            <Label htmlFor="addressType">Address Type</Label>
             <Controller
                name="addressType"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select address type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Home">Home</SelectItem>
                            <SelectItem value="Work">Work</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            />
            {errors.addressType && <p className="text-sm text-destructive">{errors.addressType.message}</p>}
          </div>
          <div className="flex items-center space-x-2 pt-2">
             <Controller
                name="isDefault"
                control={control}
                render={({ field }) => (
                    <Switch
                        id="isDefault"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                    />
                )}
            />
            <Label htmlFor="isDefault">Set as default address</Label>
          </div>

        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Address'}
          </Button>
        </div>
      </form>
  );
}
