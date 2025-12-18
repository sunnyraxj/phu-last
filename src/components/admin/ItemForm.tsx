
'use client';

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { PottersWheelSpinner } from '../shared/PottersWheelSpinner';
import { X, PlusCircle, Sparkles, CheckCircle, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { AddOptionDialog } from './AddOptionDialog';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Progress } from '../ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useImageUploader } from '@/hooks/useImageUploader';

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
  seoKeywords: z.array(z.string()).optional(),
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
  seoKeywords: [],
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
  const { toast } = useToast();
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
  
  const {
      uploadFile,
      isUploading,
      uploadProgress,
      uploadedUrl,
      error: uploadError,
      clearUpload
  } = useImageUploader('product_images');

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const images = watch('images', []);
  const seoKeywords = watch('seoKeywords', []);

  useEffect(() => {
    if (product) {
      reset({
        ...product,
        mrp: product.mrp || 0,
        gst: product.gst || undefined,
        images: product.images || [],
        seoKeywords: product.seoKeywords || [],
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
      clearUpload(); // Reset the uploader state
    }
  }, [uploadedUrl, setValue, getValues, clearUpload]);
  
  const handleApplyAiData = (data: { name: string, description: string, seoKeywords: string[] }) => {
    setValue('name', data.name, { shouldValidate: true });
    setValue('description', data.description, { shouldValidate: true });
    setValue('seoKeywords', data.seoKeywords, { shouldValidate: true });
    setIsAiDialogOpen(false);
  };

  const handleFormSubmit: SubmitHandler<ItemFormValues> = (data) => {
    const finalData = {
        ...data,
        hsn: data.hsn || undefined,
        gst: data.gst ?? undefined,
        size: data.size ? {
            height: data.size.height ?? undefined,
            width: data.size.width ?? undefined,
            length: data.size.length ?? undefined,
        } : undefined
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

  const handleAddImageUrl = () => {
    if (imageUrl) {
      try {
        z.string().url().parse(imageUrl);
        const currentImages = getValues('images');
        setValue('images', [...currentImages, imageUrl], { shouldValidate: true });
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
             <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={() => setIsAiDialogOpen(true)}>
                    <Sparkles className="mr-2 h-4 w-4 text-yellow-400" />
                    Generate with AI
                </Button>
            </div>
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
              <ImageUploader
                onFileUpload={uploadFile}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
                error={uploadError}
              />
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Or paste an image URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  disabled={isUploading}
                />
                <Button type="button" variant="outline" onClick={handleAddImageUrl} disabled={isUploading}>
                  Add URL
                </Button>
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-2">
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
              </div>
              {errors.images && <p className="text-xs text-destructive mt-2">{errors.images.message}</p>}
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

            <div className="space-y-2">
                <Label>SEO Keywords (Optional)</Label>
                <div className="flex flex-wrap gap-2">
                    {seoKeywords?.map((keyword, index) => (
                        <div key={index} className="flex items-center gap-1 bg-muted text-muted-foreground rounded-full px-3 py-1 text-sm">
                            <span>{keyword}</span>
                            <button
                                type="button"
                                onClick={() => {
                                    const newKeywords = [...(seoKeywords || [])];
                                    newKeywords.splice(index, 1);
                                    setValue('seoKeywords', newKeywords);
                                }}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
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
          <Button type="submit" disabled={isSubmitting || isUploading}>
            {isSubmitting ? <PottersWheelSpinner /> : (isUploading ? 'Uploading...' : (product ? 'Save Changes' : 'Add Item'))}
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
       <AIDetailsGeneratorDialog
            isOpen={isAiDialogOpen}
            onClose={() => setIsAiDialogOpen(false)}
            onApply={handleApplyAiData}
        />
    </>
  );
}

// Reusable ImageUploader component for the page
interface ImageUploaderProps {
    onFileUpload: (file: File) => void;
    isUploading: boolean;
    uploadProgress: number;
    error?: string | null;
}

function ImageUploader({
    onFileUpload,
    isUploading,
    uploadProgress,
    error,
}: ImageUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

    const handleFileSelect = (file: File | null) => {
        if (file) {
            onFileUpload(file);
            const previewUrl = URL.createObjectURL(file);
            setPreview(previewUrl);
        }
    };
    
    // Cleanup preview URL to prevent memory leaks
    useEffect(() => {
        if (!isUploading) {
            if (preview) {
                URL.revokeObjectURL(preview);
                setPreview(null);
            }
        }
    }, [isUploading, preview]);
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelect(event.target.files?.[0] || null);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        handleFileSelect(event.dataTransfer.files?.[0] || null);
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
        <div>
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                    "relative h-32 w-full rounded-md border-2 border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:border-primary transition-colors",
                    isDragging && "border-primary bg-primary/10"
                )}
                onClick={() => document.getElementById('image-upload-input')?.click()}
            >
                {preview && (
                    <Image src={preview} alt="Upload preview" fill className="object-contain rounded-md" />
                )}
                 {isUploading && (
                    <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10">
                        <PottersWheelSpinner />
                        <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
                        <Progress value={uploadProgress} className="w-1/2 mt-2" />
                    </div>
                )}
                {!isUploading && !preview && (
                     <>
                        <UploadCloud className="h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                            Drag & drop an image here, or click to select
                        </p>
                    </>
                )}
                <input
                    id="image-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading}
                />
            </div>
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
    );
}

// AI Details Generator Dialog
interface AIDetailsGeneratorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: { name: string, description: string, seoKeywords: string[] }) => void;
}

function AIDetailsGeneratorDialog({ isOpen, onClose, onApply }: AIDetailsGeneratorDialogProps) {
    const [imageUrl, setImageUrl] = useState('');
    const [userNotes, setUserNotes] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedData, setGeneratedData] = useState<{ name: string; description: string; seoKeywords: string[] } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setImageUrl(reader.result as string);
            };
            reader.onerror = () => {
                setError('Failed to read image file.');
            };
        }
    };
    
    const handleGenerate = async () => {
        if (!imageUrl) {
            setError('Please upload an image or provide a URL.');
            return;
        }
        setIsGenerating(true);
        setError(null);
        setGeneratedData(null);

        try {
            const response = await fetch('/api/generate-product-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    imageDataUri: imageUrl,
                    userNotes 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate details.');
            }

            const data = await response.json();
            setGeneratedData(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsGenerating(false);
        }
    };
    
     const handleClose = () => {
        setImageUrl('');
        setUserNotes('');
        setGeneratedData(null);
        setError(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Generate Product Details with AI</DialogTitle>
                    <DialogDescription>
                        Upload a product image or provide a URL and add some notes. The AI will create a name, description, and SEO keywords for you.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4 relative">
                    {isGenerating && (
                        <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10">
                            <PottersWheelSpinner />
                            <p className="mt-2 text-sm text-muted-foreground">Generating details...</p>
                        </div>
                    )}
                    {generatedData ? (
                        <div className="space-y-4">
                            <Alert>
                                <CheckCircle className="h-4 w-4" />
                                <AlertTitle>Content Generated!</AlertTitle>
                                <AlertDescription>Review the generated content below. You can edit it after applying it to the form.</AlertDescription>
                            </Alert>
                             <div className="space-y-1">
                                <Label className="font-semibold">Product Name</Label>
                                <p className="text-sm p-3 bg-muted rounded-md">{generatedData.name}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="font-semibold">Description</Label>
                                <p className="text-sm p-3 bg-muted rounded-md whitespace-pre-wrap">{generatedData.description}</p>
                            </div>
                             <div className="space-y-1">
                                <Label className="font-semibold">SEO Keywords</Label>
                                <div className="flex flex-wrap gap-2">
                                  {generatedData.seoKeywords.map(kw => (
                                    <div key={kw} className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs">{kw}</div>
                                  ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                         <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="ai-image-url">Image URL</Label>
                                    <Input 
                                        id="ai-image-url"
                                        type="text" 
                                        placeholder="https://example.com/image.jpg"
                                        value={imageUrl.startsWith('data:') ? '' : imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>Or Upload Image</Label>
                                     <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                                        <UploadCloud className="mr-2 h-4 w-4" />
                                        Upload Image
                                    </Button>
                                    <Input
                                        ref={fileInputRef}
                                        id="ai-image-upload-hidden"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </div>
                            </div>

                             {imageUrl && (
                                 <div className="mt-2 relative h-24 w-24 rounded-md overflow-hidden border">
                                    <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                                     <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-1 right-1 h-5 w-5 opacity-80 hover:opacity-100 z-10"
                                        onClick={() => setImageUrl('')}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                             )}

                            <div>
                                <Label htmlFor="ai-user-notes">Notes</Label>
                                <Textarea 
                                    id="ai-user-notes"
                                    placeholder="e.g., 'Handmade bamboo water bottle', 'Made by artisans in Assam', 'eco-friendly'"
                                    value={userNotes}
                                    onChange={(e) => setUserNotes(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancel</Button>
                    {generatedData ? (
                        <Button onClick={() => onApply(generatedData)}>Apply to Form</Button>
                    ) : (
                        <Button onClick={handleGenerate} disabled={isGenerating}>
                            {isGenerating ? <PottersWheelSpinner /> : 'Generate'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
