
'use client';

import { useForm, SubmitHandler, Controller } from 'react-hook-form';
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
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { PlusCircle } from 'lucide-react';
import { AddOptionDialog } from './AddOptionDialog';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

const bulkEditSchema = z.object({
  category: z.string().optional(),
  material: z.string().optional(),
  mrp: z.preprocess(
    (a) => (a === '' ? undefined : parseFloat(z.string().parse(a))),
    z.number().positive({ message: 'MRP must be a positive number' }).optional()
  ),
  gst: z.preprocess(
    (a) => (a === '' ? undefined : parseFloat(z.string().parse(a))),
    z.number().min(0, { message: 'GST must be a non-negative number' }).optional()
  ),
  inStock: z.enum(['in-stock', 'out-of-stock']).optional(),
}).transform(data => ({
    ...data,
    inStock: data.inStock === 'in-stock' ? true : (data.inStock === 'out-of-stock' ? false : undefined)
}));

export type BulkEditFormValues = z.infer<typeof bulkEditSchema>;

interface BulkEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BulkEditFormValues) => void;
  existingMaterials: string[];
  existingCategories: string[];
  onNewCategory: (category: string) => void;
  onNewMaterial: (material: string) => void;
  selectedCount: number;
}

export function BulkEditForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  existingMaterials, 
  existingCategories,
  onNewCategory,
  onNewMaterial,
  selectedCount
}: BulkEditFormProps) {
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);

  const {
    handleSubmit,
    register,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BulkEditFormValues>({
    resolver: zodResolver(bulkEditSchema),
    defaultValues: {
      category: '',
      material: '',
      mrp: undefined,
      gst: undefined,
      inStock: undefined,
    },
  });

  useEffect(() => {
    if (isOpen) {
        reset({
            category: '',
            material: '',
            mrp: undefined,
            gst: undefined,
            inStock: undefined,
        });
    }
  }, [reset, isOpen]);

  const handleFormSubmit: SubmitHandler<BulkEditFormValues> = (data) => {
    onSubmit(data);
  };

  const handleAddCategory = (newCategory: string) => {
    onNewCategory(newCategory);
    setValue('category', newCategory, { shouldValidate: true });
    setIsCategoryDialogOpen(false);
  }

  const handleAddMaterial = (newMaterial: string) => {
    onNewMaterial(newMaterial);
    setValue('material', newMaterial, { shouldValidate: true });
    setIsMaterialDialogOpen(false);
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Edit Products</DialogTitle>
            <DialogDescription>
              Update fields for {selectedCount} selected products. Only the fields you change will be updated.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleFormSubmit)}>
              <div className="space-y-4 my-4">
                  <div className="space-y-1">
                      <Label>Category</Label>
                      <div className="flex gap-2">
                          <Controller
                              control={control}
                              name="category"
                              render={({ field }) => (
                                  <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger>
                                          <SelectValue placeholder="Keep original or select new" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {existingCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                      </SelectContent>
                                  </Select>
                              )}
                          />
                          <Button type="button" variant="outline" size="icon" onClick={() => setIsCategoryDialogOpen(true)}>
                              <PlusCircle className="h-4 w-4" />
                          </Button>
                      </div>
                      {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
                  </div>

                  <div className="space-y-1">
                      <Label>Material</Label>
                       <div className="flex gap-2">
                          <Controller
                              control={control}
                              name="material"
                              render={({ field }) => (
                                  <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger>
                                          <SelectValue placeholder="Keep original or select new" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {existingMaterials.map(mat => <SelectItem key={mat} value={mat}>{mat}</SelectItem>)}
                                      </SelectContent>
                                  </Select>
                              )}
                          />
                          <Button type="button" variant="outline" size="icon" onClick={() => setIsMaterialDialogOpen(true)}>
                              <PlusCircle className="h-4 w-4" />
                          </Button>
                      </div>
                      {errors.material && <p className="text-xs text-destructive">{errors.material.message}</p>}
                  </div>

                  <div className="space-y-1">
                        <Label htmlFor="mrp">MRP (INR)</Label>
                        <Input id="mrp" type="number" step="0.01" {...register('mrp')} placeholder="Keep original or enter new" />
                        {errors.mrp && <p className="text-xs text-destructive">{errors.mrp.message}</p>}
                    </div>

                  <div className="space-y-1">
                      <Label htmlFor="gst">GST %</Label>
                      <Input id="gst" type="number" step="0.01" {...register('gst')} placeholder="Keep original or enter new" />
                      {errors.gst && <p className="text-xs text-destructive">{errors.gst.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Stock Status</Label>
                    <Controller
                        name="inStock"
                        control={control}
                        render={({ field }) => (
                            <RadioGroup
                                onValueChange={field.onChange}
                                className="flex space-x-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="in-stock" id="in-stock" />
                                    <Label htmlFor="in-stock">In Stock</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="out-of-stock" id="out-of-stock" />
                                    <Label htmlFor="out-of-stock">Out of Stock</Label>
                                </div>
                            </RadioGroup>
                        )}
                    />
                     {errors.inStock && <p className="text-xs text-destructive">{errors.inStock.message}</p>}
                </div>
              </div>

              <DialogFooter className="mt-6">
                  <DialogClose asChild>
                      <Button type="button" variant="outline">
                      Cancel
                      </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
              </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AddOptionDialog
        isOpen={isCategoryDialogOpen}
        onClose={() => setIsCategoryDialogOpen(false)}
        onAdd={handleAddCategory}
        title="Add New Category"
        label="Category Name"
      />
      <AddOptionDialog
        isOpen={isMaterialDialogOpen}
        onClose={() => setIsMaterialDialogOpen(false)}
        onAdd={handleAddMaterial}
        title="Add New Material"
        label="Material Name"
      />
    </>
  );
}
