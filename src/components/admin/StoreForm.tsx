'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect } from 'react';
import { Textarea } from '../ui/textarea';

const storeSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  address: z.string().min(1, 'Store address is required'),
  phone: z.string().optional(),
  image: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  googleMapsLink: z.string().url('Please enter a valid Google Maps URL'),
});

type StoreFormValues = z.infer<typeof storeSchema>;

interface StoreFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StoreFormValues) => void;
  store: StoreFormValues & { id?: string } | null;
}

export function StoreForm({ isOpen, onClose, onSubmit, store }: StoreFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StoreFormValues>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      image: '',
      googleMapsLink: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (store) {
          reset(store);
        } else {
          reset({
            name: '',
            address: '',
            phone: '',
            image: '',
            googleMapsLink: '',
          });
        }
    }
  }, [store, reset, isOpen]);

  const handleFormSubmit: SubmitHandler<StoreFormValues> = (data) => {
    onSubmit(data);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{store ? 'Edit Store' : 'Add New Store'}</DialogTitle>
          <DialogDescription>
            {store ? "Update this store's details." : "Fill out the form to add a new store location."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="space-y-4 my-4">
                <div className="space-y-1">
                    <Label htmlFor="name">Store Name</Label>
                    <Input id="name" {...register('name')} />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1">
                    <Label htmlFor="address">Address</Label>
                    <Textarea id="address" {...register('address')} rows={3} />
                    {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" {...register('phone')} />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="googleMapsLink">Google Maps URL</Label>
                    <Input id="googleMapsLink" {...register('googleMapsLink')} placeholder="https://maps.app.goo.gl/..." />
                    {errors.googleMapsLink && <p className="text-xs text-destructive">{errors.googleMapsLink.message}</p>}
                </div>
                <div className="space-y-1">
                    <Label htmlFor="image">Store Image URL</Label>
                    <Input id="image" {...register('image')} placeholder="https://picsum.photos/seed/..." />
                    {errors.image && <p className="text-xs text-destructive">{errors.image.message}</p>}
                </div>
            </div>

            <DialogFooter className="mt-6">
                <DialogClose asChild>
                    <Button type="button" variant="outline">
                    Cancel
                    </Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Store'}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
