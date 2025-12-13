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
import { useEffect, useState, useRef } from 'react';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { PlusCircle, Wand2, Sparkles } from 'lucide-react';
import { AddOptionDialog } from './AddOptionDialog';
import { GenerateProductDetailsOutput } from '@/ai/flows/generate-product-details';
import { useToast } from '@/hooks/use-toast';
import { PottersWheelSpinner } from '../shared/PottersWheelSpinner';
import Image from 'next/image';

const productSchema = z.object({
  name: z.string().min(1, { message: 'Product name is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  mrp: z.preprocess((a) => parseFloat(z.string().parse(a)), 
    z.number().positive({ message: 'MRP must be a positive number' })),
  category: z.string().min(1, { message: 'Category is required' }),
  material: z.string().min(1, { message: 'Material is required' }),
  image: z.string().min(1, { message: 'Please provide an image URL or upload an image.' }),
  'data-ai-hint': z.string().optional(),
  inStock: z.boolean(),
  hsn: z.string().optional(),
  gst: z.preprocess((a) => parseFloat(z.string().parse(a) || '0'), 
    z.number().min(0, { message: 'GST must be a non-negative number' })),
  size: z.object({
      height: z.preprocess((a) => a ? parseFloat(z.string().parse(a)) : undefined, z.number().optional()),
      length: z.preprocess((a) => a ? parseFloat(z.string().parse(a)) : undefined, z.number().optional()),
      width: z.preprocess((a) => a ? parseFloat(z.string().parse(a)) : undefined, z.number().optional()),
  }).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormValues) => void;
  product: ProductFormValues & { id?: string } | null;
  existingMaterials: string[];
  existingCategories: string[];
  onNewCategory: (category: string) => void;
  onNewMaterial: (material: string) => void;
}

export function ProductForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  product, 
  existingMaterials, 
  existingCategories,
  onNewCategory,
  onNewMaterial
}: ProductFormProps) {
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiNotes, setAiNotes] = useState('');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    control,
    setValue,
    getValues,
    watch
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      mrp: 0,
      category: '',
      material: '',
      image: '',
      'data-ai-hint': '',
      inStock: true,
      hsn: '',
      gst: 0,
      size: { height: undefined, length: undefined, width: undefined },
    },
  });

  const imageValue = watch('image');

  useEffect(() => {
    if (isOpen) {
        if (product) {
          reset(product);
        } else {
          reset({
            name: '',
            description: '',
            mrp: 0,
            category: '',
            material: '',
            image: '',
            'data-ai-hint': '',
            inStock: true,
            hsn: '',
            gst: 0,
            size: { height: undefined, length: undefined, width: undefined },
          });
        }
        setAiNotes('');
    }
  }, [product, reset, isOpen]);

  const handleFormSubmit: SubmitHandler<ProductFormValues> = (data) => {
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue('image', reader.result as string, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateDetails = async () => {
    const imageDataUri = getValues('image');
    if (!imageDataUri) {
      toast({
        variant: 'destructive',
        title: 'Image required',
        description: 'Please provide an image URL or upload an image to generate details.',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-product-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageDataUri: imageDataUri,
          productInfo: aiNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate details.');
      }

      const result: GenerateProductDetailsOutput = await response.json();

      setValue('name', result.name, { shouldValidate: true });
      setValue('description', result.description, { shouldValidate: true });

      toast({
        title: 'Details Generated!',
        description: 'The product name and description have been populated.',
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: error.message || 'Could not generate details. Please check the image and try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {product ? "Update the details of this product." : "Fill out the form to add a new product to the store."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleFormSubmit)}>
              <ScrollArea className="h-[60vh] pr-6 -mr-6">
                  <div className="space-y-4 my-4">
                       <div className="p-4 rounded-lg bg-muted/50 border border-dashed space-y-4">
                            <Label className="flex items-center gap-2 font-semibold">
                                <Sparkles className="h-5 w-5 text-primary" />
                                AI Content Generation & Image
                            </Label>
                            <div className="space-y-1">
                                <Label htmlFor="image">Image</Label>
                                <div className="flex items-center gap-2">
                                    <Input 
                                        {...register('image')} 
                                        placeholder="https://... or upload a file"
                                    />
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => fileInputRef.current?.click()}>
                                        Upload
                                    </Button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </div>
                                {imageValue && (
                                    <div className="relative h-32 w-32 mt-2 rounded-md overflow-hidden border">
                                        <Image src={imageValue} alt="Image preview" fill className="object-cover" />
                                    </div>
                                )}
                                {errors.image && <p className="text-xs text-destructive">{errors.image.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="ai-notes">AI Notes (Optional)</Label>
                                <Textarea 
                                    id="ai-notes"
                                    placeholder="e.g., 'handmade clay vase, blue glaze, from Rajasthan'. The AI will use this with the image to generate a name and description."
                                    value={aiNotes}
                                    onChange={(e) => setAiNotes(e.target.value)}
                                    rows={2}
                                />
                            </div>
                            <Button 
                                type="button" 
                                onClick={handleGenerateDetails} 
                                disabled={isGenerating}
                            >
                                {isGenerating ? <PottersWheelSpinner className="h-5 w-5" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                {isGenerating ? 'Generating...' : 'Generate Name & Description'}
                            </Button>
                        </div>
                      <div className="space-y-1">
                          <Label htmlFor="name">Product Name</Label>
                          <Input id="name" {...register('name')} />
                          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                      </div>
                      <div className="space-y-1">
                          <Label htmlFor="description">Description</Label>
                          <Textarea id="description" {...register('description')} rows={4} />
                          {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <Label htmlFor="mrp">MRP (INR)</Label>
                              <Input id="mrp" type="number" step="0.01" {...register('mrp')} />
                              {errors.mrp && <p className="text-xs text-destructive">{errors.mrp.message}</p>}
                          </div>
                          <div className="space-y-1">
                              <Label htmlFor="gst">GST %</Label>
                              <Input id="gst" type="number" step="0.01" {...register('gst')} />
                              {errors.gst && <p className="text-xs text-destructive">{errors.gst.message}</p>}
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>Category</Label>
                            <div className="flex gap-2">
                                <Controller
                                    control={control}
                                    name="category"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a category" />
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
                                                <SelectValue placeholder="Select a material" />
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
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <Label htmlFor="hsn">HSN Code (Optional)</Label>
                              <Input id="hsn" {...register('hsn')} />
                              {errors.hsn && <p className="text-xs text-destructive">{errors.hsn.message}</p>}
                          </div>
                          <div className="space-y-1">
                              <Label>Size (H x L x W) (Optional)</Label>
                              <div className="flex gap-2">
                                  <Input placeholder="H" {...register('size.height')} />
                                  <Input placeholder="L" {...register('size.length')} />
                                  <Input placeholder="W" {...register('size.width')} />
                              </div>
                          </div>
                      </div>
                      
                      <div className="space-y-1">
                          <Label htmlFor="data-ai-hint">AI Hint (Optional)</Label>
                          <Input id="data-ai-hint" {...register('data-ai-hint')} placeholder="e.g. clay pot" />
                          {errors['data-ai-hint'] && <p className="text-xs text-destructive">{errors['data-ai-hint'].message}</p>}
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

              <DialogFooter className="mt-4 pt-4 border-t">
                  <DialogClose asChild>
                      <Button type="button" variant="outline">
                      Cancel
                      </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmitting || isGenerating}>
                  {isSubmitting ? 'Saving...' : 'Save Product'}
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
