
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Checkbox } from '../ui/checkbox';


// Define the shape of the form data
export type ProductFormValues = {
  name: string;
  description: string;
  mrp: string;
  image: string;
  'data-ai-hint'?: string;
  inStock: boolean;
  hsn?: string;
  gst?: string;
  size?: {
      height?: string;
      length?: string;
      width?: string;
  };
  category: string;
  material: string;
};

// Define the shape of the product prop, which might have numbers
type ProductProp = Omit<ProductFormValues, 'mrp' | 'gst' | 'size'> & {
    id?: string;
    mrp: number;
    gst?: number;
    size?: {
        height?: number;
        length?: number;
        width?: number;
    }
};

interface ProductFormProps {
  onSuccess: (data: ProductFormValues) => void;
  onClose: () => void;
  product: ProductProp | null;
  existingMaterials: string[];
  existingCategories: string[];
  onNewCategory: (category: string) => void;
  onNewMaterial: (material: string) => void;
}

const initialFormData: ProductFormValues = {
    name: '',
    description: '',
    mrp: '',
    image: '',
    'data-ai-hint': '',
    inStock: true,
    hsn: '',
    gst: '5',
    size: { height: '', length: '', width: '' },
    category: '',
    material: '',
};

export function ProductForm({ 
  onSuccess,
  onClose,
  product, 
  existingMaterials, 
  existingCategories,
  onNewCategory,
  onNewMaterial
}: ProductFormProps) {
    const [formData, setFormData] = useState<ProductFormValues>(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiNotes, setAiNotes] = useState('');
    const { toast } = useToast();

    const {
        uploadFile,
        isUploading,
        uploadProgress,
        uploadedUrl,
        error: uploadError,
        clearUpload,
    } = useImageUploader('product_images');

    // Populate formData ONLY ONCE when an existing product is being edited.
    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                description: product.description || '',
                mrp: String(product.mrp || ''),
                image: product.image || '',
                'data-ai-hint': product['data-ai-hint'] || '',
                inStock: product.inStock,
                hsn: product.hsn || '',
                gst: String(product.gst || '5'),
                size: {
                    height: String(product.size?.height || ''),
                    length: String(product.size?.length || ''),
                    width: String(product.size?.width || ''),
                },
                category: product.category || '',
                material: product.material || '',
            });
        } else {
            setFormData(initialFormData); // Reset for new product
        }
        setAiNotes('');
        clearUpload();
    }, [product, clearUpload]);
    
    useEffect(() => {
      if (uploadedUrl) {
          setFormData((prev) => ({ ...prev, image: uploadedUrl }));
      }
    }, [uploadedUrl]);

    // Generic handler to update formData state for standard inputs
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };
    
    // Handler for nested size object
    const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            size: {
                ...prev.size,
                [id]: value
            }
        }));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Basic validation
        if (!formData.name) {
            toast({ variant: 'destructive', title: 'Name is required' });
            setIsSubmitting(false);
            return;
        }
        if (!formData.description) {
            toast({ variant: 'destructive', title: 'Description is required' });
            setIsSubmitting(false);
            return;
        }
        if (!formData.mrp || isNaN(parseFloat(formData.mrp)) || parseFloat(formData.mrp) <= 0) {
            toast({ variant: 'destructive', title: 'Valid MRP is required' });
            setIsSubmitting(false);
            return;
        }
        if (!formData.image) {
            toast({ variant: 'destructive', title: 'Image is required' });
            setIsSubmitting(false);
            return;
        }
         if (!formData.category) {
            toast({variant: 'destructive', title: 'Category is required'});
            setIsSubmitting(false);
            return;
        }
        if (!formData.material) {
            toast({variant: 'destructive', title: 'Material is required'});
            setIsSubmitting(false);
            return;
        }
        
        onSuccess(formData);
        setIsSubmitting(false);
    };

    const handleAddCategory = (newCategory: string) => {
        onNewCategory(newCategory);
        setFormData(prev => ({ ...prev, category: newCategory }));
        setIsCategoryDialogOpen(false);
    };

    const handleAddMaterial = (newMaterial: string) => {
        onNewMaterial(newMaterial);
        setFormData(prev => ({ ...prev, material: newMaterial }));
        setIsMaterialDialogOpen(false);
    };

    const handleGenerateDetails = async () => {
        if (!formData.image) {
          toast({
            variant: 'destructive',
            title: 'Image required',
            description: 'Please provide an image to generate details.',
          });
          return;
        }

        setIsGenerating(true);
        try {
          const response = await fetch('/api/generate-product-details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageDataUri: formData.image, productInfo: aiNotes }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate details.');
          }

          const result: GenerateProductDetailsOutput = await response.json();

          setFormData(prev => ({
              ...prev,
              name: result.name,
              description: result.description
          }));

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
      <form onSubmit={handleFormSubmit}>
          <ScrollArea className="h-[60vh] pr-6 -mr-6">
              <div className="space-y-4 my-4">
                   <div className="p-4 rounded-lg bg-muted/50 border border-dashed space-y-4">
                        <Label className="flex items-center gap-2 font-semibold">
                            <Sparkles className="h-5 w-5 text-primary" />
                            AI Content Generation
                        </Label>
                        
                        <ImageUploader
                          imageUrl={formData.image}
                          isUploading={isUploading}
                          uploadProgress={uploadProgress}
                          onFileUpload={uploadFile}
                          onClear={() => setFormData(prev => ({ ...prev, image: '' }))}
                          error={uploadError}
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
                            disabled={isGenerating || !formData.image || isUploading}
                        >
                            {isGenerating ? <PottersWheelSpinner className="h-5 w-5" /> : <Wand2 className="mr-2 h-4 w-4" />}
                            {isGenerating ? 'Generating...' : 'Generate Name & Description'}
                        </Button>
                    </div>
                  <div className="space-y-1">
                      <Label htmlFor="name">Product Name</Label>
                      <Input id="name" value={formData.name} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" value={formData.description} onChange={handleInputChange} rows={4} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <Label htmlFor="mrp">MRP (INR)</Label>
                          <Input id="mrp" type="number" step="0.01" value={formData.mrp} onChange={handleInputChange} />
                      </div>
                       <div className="space-y-1">
                          <Label htmlFor="gst">GST % (Optional)</Label>
                          <Input id="gst" type="number" step="0.01" value={formData.gst} onChange={handleInputChange} />
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label>Category</Label>
                        <div className="flex gap-2">
                           <Select 
                                key={product?.id} // Re-mounts the component when product changes
                                defaultValue={formData.category || undefined}
                                onValueChange={(value) => setFormData(prev => ({...prev, category: value}))}
                            >
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
                            <Select 
                                key={`${product?.id}-material`}
                                defaultValue={formData.material || undefined}
                                onValueChange={(value) => setFormData(prev => ({...prev, material: value}))}
                            >
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
                          <Label htmlFor="hsn">HSN Code (Optional)</Label>
                          <Input id="hsn" value={formData.hsn} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-1">
                          <Label>Size (H x L x W) (Optional)</Label>
                          <div className="flex gap-2">
                              <Input id="height" placeholder="H" value={formData.size?.height} onChange={handleSizeChange} />
                              <Input id="length" placeholder="L" value={formData.size?.length} onChange={handleSizeChange} />
                              <Input id="width" placeholder="W" value={formData.size?.width} onChange={handleSizeChange} />
                          </div>
                      </div>
                  </div>
                  
                  <div className="space-y-1">
                      <Label htmlFor="data-ai-hint">AI Hint (Optional)</Label>
                      <Input id="data-ai-hint" value={formData['data-ai-hint']} onChange={handleInputChange} placeholder="e.g. clay pot" />
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                          id="inStock"
                          checked={formData.inStock}
                          onCheckedChange={(checked) => setFormData(prev => ({...prev, inStock: !!checked}))}
                      />
                      <Label htmlFor="inStock" className="cursor-pointer text-sm">
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
    onClear: () => void;
    error?: string | null;
}

function ImageUploader({
    imageUrl,
    isUploading,
    uploadProgress,
    onFileUpload,
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

    