

'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { DialogFooter } from '../ui/dialog';
import { PottersWheelSpinner } from '../shared/PottersWheelSpinner';
import { X, PlusCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { AddOptionDialog } from './AddOptionDialog';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Separator } from '../ui/separator';
import { cn, isValidImageDomain } from '@/lib/utils';
import placeholderImages from '@/lib/placeholder-images.json';

const variantSchema = z.object({
  size: z.string().min(1, 'Size is required'),
  price: z.preprocess(
    val => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().positive('Price must be a positive number')
  ),
});

const itemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  description: z.string().min(1, 'Description is required'),
  baseMrp: z.preprocess(
    (val) => {
        if (typeof val === 'string') {
            if (val.trim() === '') return undefined; 
            const processed = Number(val);
            return isNaN(processed) ? val : processed;
        }
        return val;
    },
    z.number({
        invalid_type_error: "Base price must be a valid number." 
    }).positive('Price must be a positive number.').optional()
  ),
  images: z.array(z.string().url()).min(1, 'At least one image is required'),
  category: z.string().min(1, 'Category is required'),
  material: z.string().min(1, 'Material is required'),
  inStock: z.boolean().default(true),
  hsn: z.string().optional(),
  gst: z.preprocess(
    (a) => (a === '' || a === undefined ? undefined : parseFloat(z.string().parse(a))),
    z.number().min(0).optional()
  ),
  variants: z.array(variantSchema).optional(),
}).refine(data => {
    return (data.variants && data.variants.length > 0) || (typeof data.baseMrp === 'number' && data.baseMrp > 0);
}, {
    message: "Base price is required when no size variants are present.",
    path: ["baseMrp"], 
});


export type ItemFormValues = z.infer<typeof itemSchema>;

interface ItemFormProps {
  onSuccess: (data: ItemFormValues) => void;
  onCancel: () => void;
}

type Product = {
  category: string;
  material: string;
}

const defaultFormValues: ItemFormValues = {
  name: '',
  description: '',
  baseMrp: undefined,
  images: [],
  category: '',
  material: '',
  inStock: true,
  hsn: '',
  gst: undefined,
  variants: [],
};

export function ItemForm({
  onSuccess,
  onCancel,
}: ItemFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
  const { data: allProducts } = useCollection<Product>(productsQuery);

  const { categories, materials } = useMemo(() => {
    if (!allProducts) return { categories: [], materials: [] };
    const categorySet = new Set<string>();
    const materialSet = new Set<string>();

    allProducts.forEach(product => {
      if (product.category) categorySet.add(product.category);
      if (product.material) materialSet.add(product.material);
    });

    return {
      categories: Array.from(categorySet),
      materials: Array.from(materialSet),
    };
  }, [allProducts]);

  const [allCategories, setAllCategories] = useState(categories);
  const [allMaterials, setAllMaterials] = useState(materials);

  useEffect(() => {
    setAllCategories(categories);
  }, [categories]);

  useEffect(() => {
    setAllMaterials(materials);
  }, [materials]);


  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    getValues,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: defaultFormValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });
  
  const images = watch('images', []);
  const variants = watch('variants', []);
  
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  
    useEffect(() => {
        reset(defaultFormValues);
    }, [reset]);
  
  const handleFormSubmit: SubmitHandler<ItemFormValues> = (data) => {
    onSuccess(data);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setValue('images', newImages, { shouldValidate: true, shouldDirty: true });
  };
  
  const handleAddCategory = (value: string) => {
    if (value && !allCategories.includes(value)) {
      setAllCategories(prev => [...prev, value]);
    }
    setValue('category', value, { shouldValidate: true, shouldDirty: true });
    setIsAddCategoryOpen(false);
  }
  
  const handleAddMaterial = (value: string) => {
    if (value && !allMaterials.includes(value)) {
      setAllMaterials(prev => [...prev, value]);
    }
    setValue('material', value, { shouldValidate: true, shouldDirty: true });
    setIsAddMaterialOpen(false);
  }

  const handleAddImageUrl = () => {
    if (imageUrl) {
      try {
        z.string().url().parse(imageUrl);
        const currentImages = getValues('images');
        setValue('images', [...currentImages, imageUrl], { shouldValidate: true, shouldDirty: true });
        setImageUrl(''); // Clear the input field
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Invalid URL",
          description: "Please enter a valid image URL.",
        });
      }
    }
  };
  
  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <ScrollArea className="h-[70vh] pr-6 -mr-6">
          <div className="space-y-4 my-4">
            <div className="space-y-1">
              <Label htmlFor="name">Item Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} rows={5} />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label>Images</Label>
               <div className="flex items-center gap-2">
                 <Input
                  type="text"
                  placeholder="Paste an image URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={handleAddImageUrl}>Add URL</Button>
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-2">
                {images && images.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                    {url && isValidImageDomain(url) ? (
                        <Image src={url} alt={`Item image ${index + 1}`} fill className="object-cover" />
                    ) : (
                        <div className="flex items-center justify-center h-full bg-muted text-muted-foreground text-xs text-center p-1">
                          Invalid or unsecured URL
                        </div>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-5 w-5 opacity-80 hover:opacity-100"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              {errors.images && <p className="text-xs text-destructive mt-2">{errors.images.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(!variants || variants.length === 0) && (
                    <div className="space-y-1">
                        <Label htmlFor="baseMrp">Base Price (MRP)</Label>
                        <Input id="baseMrp" type="number" {...register('baseMrp')} placeholder="e.g., 1250.00" />
                        <p className="text-xs text-muted-foreground">Required if no variants are added.</p>
                        {errors.baseMrp && <p className="text-xs text-destructive">{errors.baseMrp.message}</p>}
                    </div>
                )}
              <div className="space-y-1 pt-7">
                  <div className="flex items-center space-x-2">
                      <Controller
                        control={control}
                        name="inStock"
                        render={({ field }) => (
                           <Switch
                              id="inStock"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                           />
                        )}
                      />
                      <Label htmlFor="inStock">In Stock</Label>
                  </div>
              </div>
            </div>
            
            <div className="space-y-2">
                <Separator />
                <Label>Size Variants (Optional)</Label>
                <p className="text-xs text-muted-foreground">Add different sizes and prices for this product.</p>
                <div className="space-y-2">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-2 p-2 border rounded-md">
                            <div className="flex-1 grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label htmlFor={`variants.${index}.size`} className="text-xs">Size Name</Label>
                                    <Input
                                        id={`variants.${index}.size`}
                                        placeholder="e.g., Small, 12-inch"
                                        {...register(`variants.${index}.size` as const)}
                                    />
                                    {errors.variants?.[index]?.size && <p className="text-xs text-destructive">{errors.variants[index].size.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor={`variants.${index}.price`} className="text-xs">Price (MRP)</Label>
                                    <Input
                                        id={`variants.${index}.price`}
                                        type="number"
                                        placeholder="e.g., 1450.00"
                                        {...register(`variants.${index}.price` as const)}
                                    />
                                    {errors.variants?.[index]?.price && <p className="text-xs text-destructive">{errors.variants[index].price.message}</p>}
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive h-8 w-8"
                                onClick={() => remove(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ size: '', price: undefined as unknown as number })}
                >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Size Variant
                </Button>
            </div>
            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="category">Category</Label>
                 <Controller
                    control={control}
                    name="category"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                           {allCategories.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                          <Button type="button" variant="ghost" className="w-full justify-start mt-1" onClick={() => setIsAddCategoryOpen(true)}>
                              <PlusCircle className="mr-2 h-4 w-4"/> Add New
                          </Button>
                        </SelectContent>
                      </Select>
                    )}
                 />
                {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
              </div>
               <div className="space-y-1">
                <Label htmlFor="material">Material</Label>
                 <Controller
                    control={control}
                    name="material"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="material">
                          <SelectValue placeholder="Select a material" />
                        </SelectTrigger>
                        <SelectContent>
                          {allMaterials.map(mat => (
                              <SelectItem key={mat} value={mat}>{mat}</SelectItem>
                          ))}
                           <Button type="button" variant="ghost" className="w-full justify-start mt-1" onClick={() => setIsAddMaterialOpen(true)}>
                              <PlusCircle className="mr-2 h-4 w-4"/> Add New
                          </Button>
                        </SelectContent>
                      </Select>
                    )}
                 />
                {errors.material && <p className="text-xs text-destructive">{errors.material.message}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1">
                  <Label htmlFor="hsn">HSN Code (Optional)</Label>
                  <Input id="hsn" {...register('hsn')} />
                  {errors.hsn && <p className="text-xs text-destructive">{errors.hsn.message}</p>}
               </div>
               <div className="space-y-1">
                  <Label htmlFor="gst">GST % (Optional)</Label>
                  <Input id="gst" type="number" step="0.01" {...register('gst')} />
                  {errors.gst && <p className="text-xs text-destructive">{errors.gst.message}</p>}
               </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="mt-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? <PottersWheelSpinner /> : 'Add Item'}
          </Button>
        </DialogFooter>
        
      </form>
      <AddOptionDialog 
        isOpen={isAddCategoryOpen} 
        onClose={() => setIsAddCategoryOpen(false)}
        onAdd={handleAddCategory}
        title="Add New Category"
        label="Category Name"
      />
      <AddOptionDialog 
        isOpen={isAddMaterialOpen} 
        onClose={() => setIsAddMaterialOpen(false)}
        onAdd={handleAddMaterial}
        title="Add New Material"
        label="Material Name"
      />
    </>
  );
}
