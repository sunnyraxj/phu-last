
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useForm, Controller, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { DialogFooter } from '../ui/dialog';
import { PottersWheelSpinner } from '../shared/PottersWheelSpinner';
import { X, PlusCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';
import { isValidImageDomain } from '@/lib/utils';

const variantSchema = z.object({
  size: z.string().min(1, 'Size is required'),
  price: z.preprocess(
    val => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().positive('Price must be a positive number')
  ),
});

const quickEditSchema = z.object({
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
  variants: z.array(variantSchema).optional(),
}).refine(data => {
    return (data.variants && data.variants.length > 0) || (typeof data.baseMrp === 'number' && data.baseMrp > 0);
}, {
    message: "Base price is required when no size variants are present.",
    path: ["baseMrp"], 
});

export type QuickEditFormValues = z.infer<typeof quickEditSchema>;

interface QuickEditFormProps {
  onSuccess: (data: QuickEditFormValues) => void;
  onCancel: () => void;
  item: QuickEditFormValues & { id?: string };
}

export function QuickEditForm({ onSuccess, onCancel, item }: QuickEditFormProps) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<QuickEditFormValues>({
    resolver: zodResolver(quickEditSchema),
    defaultValues: item,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });
  
  const images = getValues('images');
  const variants = getValues('variants');
  
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    reset(item);
  }, [item, reset]);
  
  const handleFormSubmit: SubmitHandler<QuickEditFormValues> = (data) => {
    onSuccess(data);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...(getValues('images') || [])];
    newImages.splice(index, 1);
    setValue('images', newImages, { shouldValidate: true, shouldDirty: true });
  };

  const handleAddImageUrl = () => {
    if (imageUrl) {
      try {
        z.string().url().parse(imageUrl);
        const currentImages = getValues('images') || [];
        setValue('images', [...currentImages, imageUrl], { shouldValidate: true, shouldDirty: true });
        setImageUrl(''); 
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
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <ScrollArea className="h-[60vh] pr-6 -mr-6">
        <div className="space-y-4 my-4">
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
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
              {images && images.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                  {url && isValidImageDomain(url) ? (
                      <Image src={url} alt={`Item image ${index + 1}`} fill className="object-cover" />
                  ) : (
                      <div className="flex items-center justify-center h-full bg-muted text-muted-foreground text-xs text-center p-1">
                        Invalid URL
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

          <Separator />
          
          {(!variants || variants.length === 0) && (
              <div className="space-y-1">
                  <Label htmlFor="baseMrp">Base Price (MRP)</Label>
                  <Input id="baseMrp" type="number" {...register('baseMrp')} placeholder="e.g., 1250.00" />
                  <p className="text-xs text-muted-foreground">Required if no variants are added.</p>
                  {errors.baseMrp && <p className="text-xs text-destructive">{errors.baseMrp.message}</p>}
              </div>
          )}
          
          <div className="space-y-2">
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
        </div>
      </ScrollArea>
      <DialogFooter className="mt-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <PottersWheelSpinner /> : 'Save Changes'}
        </Button>
      </DialogFooter>
    </form>
  );
}
