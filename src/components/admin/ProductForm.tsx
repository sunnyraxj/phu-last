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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useEffect } from 'react';
import { Textarea } from '../ui/textarea';

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
}

export function ProductForm({ isOpen, onClose, onSubmit, product }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
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
  }, [product, reset]);

  const handleFormSubmit: SubmitHandler<ProductFormValues> = (data) => {
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input id="price" type="number" step="0.01" {...register('price')} />
            {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" {...register('category')} />
            {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="material">Material</Label>
            <Input id="material" {...register('material')} />
            {errors.material && <p className="text-sm text-destructive">{errors.material.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="collection">Collection</Label>
            <Input id="collection" {...register('collection')} />
            {errors.collection && <p className="text-sm text-destructive">{errors.collection.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">Image URL</Label>
            <Input id="image" {...register('image')} />
            {errors.image && <p className="text-sm text-destructive">{errors.image.message}</p>}
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="inStock" {...register('inStock')} defaultChecked={true}/>
            <Label htmlFor="inStock">In Stock</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
