
'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState, useMemo } from 'react';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { PlusCircle, Wand2, Sparkles, UploadCloud, X } from 'lucide-react';
import { AddOptionDialog } from './AddOptionDialog';
import { GenerateProductDetailsOutput } from '@/ai/flows/generate-product-details';
import { useToast } from '@/hooks/use-toast';
import { PottersWheelSpinner } from '../shared/PottersWheelSpinner';
import Image from 'next/image';
import { useImageUploader } from '@/hooks/useImageUploader';
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';

// Schema without category and material, as they are handled by local state
const productSchema = z.object({
  name: z.string().min(1, { message: 'Product name is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  mrp: z.preprocess((a) => parseFloat(z.string().parse(a)), 
    z.number().positive({ message: 'MRP must be a positive number' })),
  image: z.string().url({ message: 'Please provide a valid image URL.' }),
  'data-ai-hint': z.string().optional(),
  inStock: z.boolean(),
  hsn: z.string().optional(),
  gst: z.preprocess((a) => a ? parseFloat(z.string().parse(a)) : 0, 
    z.number().min(0, { message: 'GST must be a non-negative number' }).optional()),
  size: z.object({
      height: z.preprocess((a) => a ? parseFloat(z.string().parse(a)) : undefined, z.number().optional()),
      length: z.preprocess((a) => a ? parseFloat(z.string().parse(a)) : undefined, z.number().optional()),
      width: z.preprocess((a) => a ? parseFloat(z.string().parse(a)) : undefined, z.number().optional()),
  }).optional(),
});

// Form values include category and material for submission, but they are not part of the Zod schema for validation.
export type ProductFormValues = z.infer<typeof productSchema> & {
    category: string;
    material: string;
};

interface ProductFormProps {
  onSuccess: (data: ProductFormValues) => void;
  onClose: () => void;
  product: ProductFormValues & { id?: string } | null;
  existingMaterials: string[];
  existingCategories: string[];
  onNewCategory: (category: string) => void;
  onNewMaterial: (material: string) => void;
}

export function ProductForm({ 
  onSuccess,
  onClose,
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

  const [category, setCategory] = useState<string | undefined>(undefined);
  const [material, setMaterial] = useState<string | undefined>(undefined);


  const {
    uploadFile,
    isUploading,
    uploadProgress,
    uploadedUrl,
    error: uploadError,
    clearUpload
  } = useImageUploader('product_images');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    getValues,
    watch,
    setError,
    clearErrors
  } = useForm<Omit<ProductFormValues, 'category' | 'material'>>({
    resolver: zodResolver(productSchema),
    defaultValues: product ? {
      ...product,
      mrp: product.mrp || 0,
      gst: product.gst || 0,
    } : {
      name: '',
      description: '',
      mrp: 0,
      image: '',
      'data-ai-hint': '',
      inStock: true,
      hsn: '',
      gst: 0,
      size: { height: undefined, length: undefined, width: undefined },
    },
  });

  const imageValue = watch('image');

  // Reset form when product prop changes
  useEffect(() => {
    if (product) {
      reset(product);
      setCategory(product.category);
      setMaterial(product.material);
    } else {
      reset({
        name: '', description: '', mrp: 0, image: '', 'data-ai-hint': '', inStock: true, hsn: '', gst: 0, size: { height: undefined, length: undefined, width: undefined },
      });
      setCategory(undefined);
      setMaterial(undefined);
    }
    setAiNotes('');
    clearUpload();
  }, [product, reset, clearUpload]);

  // Handle image upload completion
  useEffect(() => {
    if (uploadedUrl) {
      setValue('image', uploadedUrl, { shouldValidate: true });
      clearErrors('image');
    }
  }, [uploadedUrl, setValue, clearErrors]);


  const handleFormSubmit: SubmitHandler<Omit<ProductFormValues, 'category' | 'material'>> = (data) => {
    const finalCategory = category ?? product?.category;
    const finalMaterial = material ?? product?.material;
    
    if (!finalCategory) {
        toast({variant: 'destructive', title: 'Category is required'});
        return;
    }
    if (!finalMaterial) {
        toast({variant: 'destructive', title: 'Material is required'});
        return;
    }
    if (!data.image) {
      setError('image', { type: 'manual', message: 'An image is required.' });
      return;
    }
    
    const completeFormData: ProductFormValues = {
        ...data,
        gst: data.gst || 0,
        category: finalCategory,
        material: finalMaterial,
    };

    onSuccess(completeFormData);
  };

  const handleAddCategory = (newCategory: string) => {
    onNewCategory(newCategory);
    setCategory(newCategory);
    setIsCategoryDialogOpen(false);
  }

  const handleAddMaterial = (newMaterial: string) => {
    onNewMaterial(newMaterial);
    setMaterial(newMaterial);
    setIsMaterialDialogOpen(false);
  }

  const handleGenerateDetails = async () => {
    const imageDataUri = getValues('image');
    if (!imageDataUri) {
      toast({
        variant: 'destructive',
        title: 'Image required',
        description: 'Please provide an image URL to generate details.',
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
      <form onSubmit={handleSubmit(handleFormSubmit)}>
          <ScrollArea className="h-[60vh] pr-6 -mr-6">
              <div className="space-y-4 my-4">
                   <div className="p-4 rounded-lg bg-muted/50 border border-dashed space-y-4">
                        <Label className="flex items-center gap-2 font-semibold">
                            <Sparkles className="h-5 w-5 text-primary" />
                            AI Content Generation
                        </Label>
                        
                        <ImageUploader
                          imageUrl={imageValue}
                          isUploading={isUploading}
                          uploadProgress={uploadProgress}
                          onFileUpload={uploadFile}
                          onUrlChange={(url) => setValue('image', url, { shouldValidate: true })}
                          onClear={() => {
                            clearUpload();
                            setValue('image', '', { shouldValidate: true });
                          }}
                          error={errors.image?.message || uploadError}
                        />

                        <div className="space-y-1">
                            <Label htmlFor="ai-notes-product-form">AI Notes (Optional)</Label>
                            <Textarea 
                                id="ai-notes-product-form"
                                placeholder="e.g., 'handmade clay vase, blue glaze, from Rajasthan'. The AI will use this with the image to generate a name and description."
                                value={aiNotes}
                                onChange={(e) => setAiNotes(e.target.value)}
                                rows={2}
                            />
                        </div>
                        <Button 
                            type="button" 
                            onClick={handleGenerateDetails} 
                            disabled={isGenerating || !imageValue || isUploading}
                        >
                            {isGenerating ? <PottersWheelSpinner className="h-5 w-5" /> : <Wand2 className="mr-2 h-4 w-4" />}
                            {isGenerating ? 'Generating...' : 'Generate Name & Description'}
                        </Button>
                    </div>
                  <div className="space-y-1">
                      <Label htmlFor="product-name">Product Name</Label>
                      <Input id="product-name" {...register('name')} />
                      {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-1">
                      <Label htmlFor="product-description">Description</Label>
                      <Textarea id="product-description" {...register('description')} rows={4} />
                      {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <Label htmlFor="product-mrp">MRP (INR)</Label>
                          <Input id="product-mrp" type="number" step="0.01" {...register('mrp')} />
                          {errors.mrp && <p className="text-xs text-destructive">{errors.mrp.message}</p>}
                      </div>
                       <div className="space-y-1">
                          <Label htmlFor="product-gst">GST %</Label>
                          <Input id="product-gst" type="number" step="0.01" {...register('gst')} />
                          {errors.gst && <p className="text-xs text-destructive">{errors.gst.message}</p>}
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label>Category</Label>
                        <div className="flex gap-2">
                           <Select defaultValue={product?.category} onValueChange={setCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {existingCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button type="button" variant="outline" size="icon" onClick={() => setIsCategoryDialogOpen(true)}>
                                <PlusCircle className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label>Material</Label>
                         <div className="flex gap-2">
                            <Select defaultValue={product?.material} onValueChange={setMaterial}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a material" />
                                </SelectTrigger>
                                <SelectContent>
                                    {existingMaterials.map(mat => <SelectItem key={mat} value={mat}>{mat}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button type="button" variant="outline" size="icon" onClick={() => setIsMaterialDialogOpen(true)}>
                                <PlusCircle className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <Label htmlFor="product-hsn">HSN Code (Optional)</Label>
                          <Input id="product-hsn" {...register('hsn')} />
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
                      <Label htmlFor="product-ai-hint">AI Hint (Optional)</Label>
                      <Input id="product-ai-hint" {...register('data-ai-hint')} placeholder="e.g. clay pot" />
                      {errors['data-ai-hint'] && <p className="text-xs text-destructive">{errors['data-ai-hint'].message}</p>}
                  </div>

                   <div className="flex items-center space-x-2 pt-2">
                      <input
                        type="checkbox"
                        id="product-inStock"
                        {...register('inStock')}
                        defaultChecked={product ? product.inStock : true}
                        className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                      />
                      <Label htmlFor="product-inStock" className="cursor-pointer text-sm">
                        Product is in stock and available for purchase
                      </Label>
                  </div>
              </div>
          </ScrollArea>

          <DialogFooter className="mt-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isGenerating || isUploading}>
              {isSubmitting ? 'Saving...' : 'Save Product'}
              </Button>
          </DialogFooter>
      </form>
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

// Reusable ImageUploader component
interface ImageUploaderProps {
    imageUrl: string;
    isUploading: boolean;
    uploadProgress: number;
    onFileUpload: (file: File) => void;
    onUrlChange: (url: string) => void;
    onClear: () => void;
    error?: string | null;
}

function ImageUploader({
    imageUrl,
    isUploading,
    uploadProgress,
    onFileUpload,
    onUrlChange,
    onClear,
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

    return (
        <div className="space-y-2">
            <Label htmlFor="image">Image</Label>
            {imageUrl && !isUploading ? (
                <div className="relative h-48 w-full rounded-md overflow-hidden bg-muted">
                    <Image src={imageUrl} alt="Image preview" fill className="object-cover" />
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7"
                        onClick={onClear}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : isUploading ? (
                <div className="h-48 w-full rounded-md border border-dashed flex flex-col items-center justify-center p-4">
                    <PottersWheelSpinner />
                    <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
                    <Progress value={uploadProgress} className="w-full mt-2" />
                </div>
            ) : (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={cn(
                        "h-48 w-full rounded-md border-2 border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:border-primary transition-colors",
                        isDragging && "border-primary bg-primary/10"
                    )}
                    onClick={() => document.getElementById('image-upload-input-product')?.click()}
                >
                    <UploadCloud className="h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                        Drag & drop an image here, or click to select a file
                    </p>
                    <input
                        id="image-upload-input-product"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>
            )}
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
    );
}


    