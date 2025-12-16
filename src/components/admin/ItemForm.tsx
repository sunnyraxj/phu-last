
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
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
import { UploadCloud, X, PlusCircle } from 'lucide-react';
import Image from 'next/image';
import { useImageUploader } from '@/hooks/useImageUploader';
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';
import { AddOptionDialog } from './AddOptionDialog';

const itemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  description: z.string().min(1, 'Description is required'),
  mrp: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive('Price must be positive')
  ),
  images: z.array(z.string().url()).min(1, 'At least one image is required'),
  category: z.string().min(1, 'Category is required'),
  material: z.string().min(1, 'Material is required'),
  inStock: z.boolean().default(true),
  hsn: z.string().optional(),
  gst: z.preprocess(
    (a) => (a === '' ? undefined : parseFloat(z.string().parse(a))),
    z.number().min(0).optional()
  ),
  size: z.object({
    height: z.preprocess((a) => (a === '' ? undefined : parseFloat(z.string().parse(a))), z.number().min(0).optional()),
    length: z.preprocess((a) => (a === '' ? undefined : parseFloat(z.string().parse(a))), z.number().min(0).optional()),
    width: z.preprocess((a) => (a === '' ? undefined : parseFloat(z.string().parse(a))), z.number().min(0).optional()),
  }).optional(),
});

export type ItemFormValues = z.infer<typeof itemSchema>;

interface ItemFormProps {
  onSuccess: (data: ItemFormValues) => void;
  onCancel: () => void;
  product: ItemFormValues & { id?: string } | null;
  categories: string[];
  materials: string[];
  onNewCategory: (category: string) => void;
  onNewMaterial: (material: string) => void;
}

const defaultFormValues: ItemFormValues = {
  name: '',
  description: '',
  mrp: 0,
  images: [],
  category: '',
  material: '',
  inStock: true,
  hsn: '',
  gst: undefined,
  size: { height: undefined, length: undefined, width: undefined },
};

export function ItemForm({
  onSuccess,
  onCancel,
  product,
  categories,
  materials,
  onNewCategory,
  onNewMaterial
}: ItemFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: defaultFormValues,
  });

  const { uploadFile, isUploading, uploadProgress, uploadedUrl, error: uploadError, clearUpload } = useImageUploader('product_images');
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);

  const images = watch('images', []);

  useEffect(() => {
    if (product) {
      reset({
        ...product,
        mrp: product.mrp || 0,
        gst: product.gst || undefined,
        images: product.images || [],
        size: product.size || { height: undefined, length: undefined, width: undefined },
      });
    } else {
        reset(defaultFormValues);
    }
  }, [product, reset]);
  
  useEffect(() => {
    if (uploadedUrl) {
      const currentImages = getValues('images');
      setValue('images', [...currentImages, uploadedUrl], { shouldValidate: true });
      clearUpload();
    }
  }, [uploadedUrl, setValue, clearUpload, getValues]);


  const handleFormSubmit: SubmitHandler<ItemFormValues> = (data) => {
    const finalData = {
        ...data,
        hsn: data.hsn || null,
        gst: data.gst ?? null,
        size: data.size ? {
            height: data.size.height ?? null,
            width: data.size.width ?? null,
            length: data.size.length ?? null,
        } : null
    }
    onSuccess(finalData as ItemFormValues);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setValue('images', newImages, { shouldValidate: true });
  };
  
  const handleAddCategory = (value: string) => {
    onNewCategory(value);
    setValue('category', value, { shouldValidate: true });
    setIsAddCategoryOpen(false);
  }
  
  const handleAddMaterial = (value: string) => {
    onNewMaterial(value);
    setValue('material', value, { shouldValidate: true });
    setIsAddMaterialOpen(false);
  }
  
  return (
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
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {images && images.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                            <Image src={url} alt={`Item image ${index + 1}`} fill className="object-cover" />
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
                     <ImageUploader onFileUpload={uploadFile} isUploading={isUploading} uploadProgress={uploadProgress} error={uploadError} />
                </div>
                 {errors.images && <p className="text-xs text-destructive">{errors.images.message}</p>}
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="mrp">Price (MRP)</Label>
              <Input id="mrp" type="number" step="0.01" {...register('mrp')} />
              {errors.mrp && <p className="text-xs text-destructive">{errors.mrp.message}</p>}
            </div>
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
                         {categories.map(cat => (
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
                        {materials.map(mat => (
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
          
           <div>
            <Label>Dimensions (Optional)</Label>
            <div className="grid grid-cols-3 gap-4 mt-1">
                <div className="space-y-1">
                    <Label htmlFor="length" className="text-xs">Length (cm)</Label>
                    <Input id="length" type="number" step="0.01" {...register('size.length')} />
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="width" className="text-xs">Width (cm)</Label>
                    <Input id="width" type="number" step="0.01" {...register('size.width')} />
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="height" className="text-xs">Height (cm)</Label>
                    <Input id="height" type="number" step="0.01" {...register('size.height')} />
                </div>
            </div>
           </div>

        </div>
      </ScrollArea>
      <DialogFooter className="mt-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <PottersWheelSpinner /> : (product ? 'Save Changes' : 'Add Item')}
        </Button>
      </DialogFooter>
      
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
    </form>
  );
}


interface ImageUploaderProps {
    isUploading: boolean;
    uploadProgress: number;
    onFileUpload: (file: File) => void;
    error?: string | null;
}

function ImageUploader({
    isUploading,
    uploadProgress,
    onFileUpload,
    error
}: ImageUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onFileUpload(file);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file) {
            onFileUpload(file);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    };
    
    if (isUploading) {
        return (
            <div className="aspect-square w-full rounded-md border border-dashed flex flex-col items-center justify-center p-2">
                <PottersWheelSpinner />
                <p className="text-xs text-muted-foreground mt-1">Uploading...</p>
                <Progress value={uploadProgress} className="w-full mt-2 h-1" />
            </div>
        )
    }

    return (
        <div className="col-span-1">
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                    "aspect-square w-full rounded-md border-2 border-dashed flex flex-col items-center justify-center p-2 text-center cursor-pointer hover:border-primary transition-colors",
                    isDragging && "border-primary bg-primary/10"
                )}
                onClick={() => document.getElementById('image-upload-input')?.click()}
            >
                <UploadCloud className="h-6 w-6 text-muted-foreground" />
                <p className="mt-1 text-xs text-muted-foreground">
                    Add Image
                </p>
                <input
                    id="image-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
    );
}
