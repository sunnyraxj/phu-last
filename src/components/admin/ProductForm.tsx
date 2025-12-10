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
import { Checkbox } from '@/components/ui/checkbox';
import { useEffect } from 'react';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { CreatableSelect } from './CreatableSelect';

const productSchema = z.object({
  name: z.string().min(1, { message: 'Product name is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  price: z.preprocess((a) => parseFloat(z.string().parse(a)), 
    z.number().positive({ message: 'Price must be a positive number' })),
  category: z.string().min(1, { message: 'Category is required' }),
  material: z.string().min(1, { message: 'Material is required' }),
  collection: z.string().min(1, { message: 'Collection is required' }),
  image: z.string().url({ message: 'Please enter a valid image URL' }),
  'data-ai-hint': z.string().optional(),
  inStock: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormValues) => void;
  product: ProductFormValues & { id?: string } | null;
  existingMaterials: string[];
  existingCollections: string[];
}

export function ProductForm({ isOpen, onClose, onSubmit, product, existingMaterials, existingCollections }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    control,
    setValue,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category: '',
      material: '',
      collection: '',
      image: '',
      'data-ai-hint': '',
      inStock: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (product) {
          reset(product);
        } else {
          reset({
            name: '',
            description: '',
            price: 0,
            category: '',
            material: '',
            collection: '',
            image: '',
            'data-ai-hint': '',
            inStock: true,
          });
        }
    }
  }, [product, reset, isOpen]);

  const handleFormSubmit: SubmitHandler<ProductFormValues> = (data) => {
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {product ? "Update the details of this product." : "Fill out the form to add a new product to the store."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
            <ScrollArea className="h-96 pr-6 -mr-6">
                <div className="space-y-4 my-4">
                    <div className="space-y-1">
                        <Label htmlFor="name">Product Name</Label>
                        <Input id="name" {...register('name')} />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="price">Price (INR)</Label>
                        <Input id="price" type="number" step="0.01" {...register('price')} />
                        {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" {...register('description')} rows={4} />
                        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="category">Category</Label>
                        <Input id="category" {...register('category')} />
                        {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
                    </div>
                    <Controller
                        control={control}
                        name="material"
                        render={({ field }) => (
                            <div className="space-y-1">
                                <Label>Material</Label>
                                <CreatableSelect
                                    options={existingMaterials}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Select or create a material..."
                                />
                                {errors.material && <p className="text-xs text-destructive">{errors.material.message}</p>}
                            </div>
                        )}
                    />
                     <Controller
                        control={control}
                        name="collection"
                        render={({ field }) => (
                            <div className="space-y-1">
                                <Label>Collection</Label>
                                <CreatableSelect
                                    options={existingCollections}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Select or create a collection..."
                                />
                                {errors.collection && <p className="text-xs text-destructive">{errors.collection.message}</p>}
                            </div>
                        )}
                    />
                     <div className="space-y-1">
                        <Label htmlFor="image">Image URL</Label>
                        <Input id="image" {...register('image')} placeholder="https://picsum.photos/seed/..." />
                        {errors.image && <p className="text-xs text-destructive">{errors.image.message}</p>}
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                        <Controller
                          control={control}
                          name="inStock"
                          render={({ field }) => (
                            <Checkbox 
                              id="inStock" 
                              checked={field.value} 
                              onCheckedChange={field.onChange} 
                            />
                          )}
                        />
                        <Label htmlFor="inStock" className="cursor-pointer text-sm">
                           Product is in stock and available for purchase
                        </Label>
                    </div>
                </div>
            </ScrollArea>

            <DialogFooter className="mt-4">
                <DialogClose asChild>
                    <Button type="button" variant="outline">
                    Cancel
                    </Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Product'}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
