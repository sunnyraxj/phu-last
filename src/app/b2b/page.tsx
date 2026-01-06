

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Header } from "@/components/shared/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, UploadCloud, Trash2, PlusCircle, CheckCircle, Wand2, Edit } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Combobox } from '@/components/ui/combobox';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DrawingCanvas } from '@/components/shared/DrawingCanvas';

const MIN_BULK_QUANTITY = 100;

const materialRequestSchema = z.object({
  materialId: z.string().min(1, "Material must be selected"),
  materialName: z.string().min(1),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  customizationDetails: z.string().optional(),
  referenceImages: z.array(z.string().url()).optional(),
  productName: z.string().optional(),
  budgetPerPiece: z.number().optional(),
  description: z.string().optional(),
  height: z.string().optional(),
  length: z.string().optional(),
  width: z.string().optional(),
  shape: z.string().optional(),
});

const b2bRequestSchema = z.object({
    orderType: z.enum(['bulk', 'customize']),
    materials: z.array(materialRequestSchema).min(1, 'At least one product must be added.'),
    requirementDate: z.string({
        required_error: 'A delivery timeline is required.',
    }).min(1, 'A delivery timeline is required.'),
    customerDetails: z.object({
        name: z.string().min(1, 'Your name is required.'),
        mobile: z.string().min(10, 'A valid mobile number is required.'),
        email: z.string().email().optional().or(z.literal('')),
        state: z.string().optional(),
        gstNumber: z.string().optional(),
        totalBudget: z.number().optional(),
    }),
});

type B2BFormValues = z.infer<typeof b2bRequestSchema>;

export default function B2BPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [orderType, setOrderType] = useState<'bulk' | 'customize'>('bulk');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadIndex, setUploadIndex] = useState<number | null>(null);
    const [isDrawingOpen, setIsDrawingOpen] = useState(false);
    const [drawingContext, setDrawingContext] = useState<{productIndex: number; imageIndex?: number; imageUrl?: string} | null>(null);


    const {
        control,
        register,
        handleSubmit,
        setValue,
        watch,
        getValues,
        formState: { errors },
    } = useForm<B2BFormValues>({
        resolver: zodResolver(b2bRequestSchema),
        defaultValues: {
            orderType: 'bulk',
            materials: [{ 
                productName: '',
                materialId: 'bulk-material', // schema requires it, but we don't use it for bulk
                materialName: '', 
                quantity: MIN_BULK_QUANTITY, 
                customizationDetails: '', 
                referenceImages: [],
                budgetPerPiece: undefined,
                description: '',
                height: '',
                length: '',
                width: '',
                shape: '',
            }],
            customerDetails: {
                name: '',
                mobile: '',
                email: '',
                state: '',
                gstNumber: '',
                totalBudget: undefined,
            }
        },
    });

    const { fields, append, remove, update } = useFieldArray({
        control,
        name: 'materials',
    });

    const watchedMaterials = watch('materials');
    
    const availableMaterials = useMemo(() => {
        const coreMaterials = [
            { id: 'cane', name: 'Cane', unit: 'pcs' },
            { id: 'bamboo', name: 'Bamboo', unit: 'pcs' },
            { id: 'jute', name: 'Jute', unit: 'pcs' },
        ];
        return coreMaterials;
    }, []);

    
    useEffect(() => {
        setValue('orderType', orderType);
    }, [orderType, setValue]);

    const handleFileUpload = async (file: File | Blob, productIndex: number, imageIndex?: number) => {
        const currentImages = getValues(`materials.${productIndex}.referenceImages`) || [];
        
        // Don't check limit if we are editing an existing image
        if (imageIndex === undefined && currentImages.length >= 4) {
            toast({ variant: 'destructive', title: 'Upload Limit Reached', description: 'You can upload a maximum of 4 images per product.' });
            return;
        }

        setIsUploading(true);
        try {
            const response = await fetch(`/api/upload?filename=${file instanceof File ? file.name : 'drawing.png'}`, {
                method: 'POST',
                body: file,
            });
            const newBlob = await response.json();
            if (newBlob.url) {
                if(imageIndex !== undefined) {
                    // Replace existing image
                    const updatedImages = [...currentImages];
                    updatedImages[imageIndex] = newBlob.url;
                    setValue(`materials.${productIndex}.referenceImages`, updatedImages);
                } else {
                    // Add new image
                    setValue(`materials.${productIndex}.referenceImages`, [...currentImages, newBlob.url]);
                }
                toast({ title: 'Image saved successfully!' });
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Upload failed', description: 'Could not upload image.' });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    
    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && uploadIndex !== null) {
            handleFileUpload(file, uploadIndex);
        }
    };

    const handleSaveDrawing = (dataUrl: string) => {
        if (drawingContext) {
            fetch(dataUrl)
                .then(res => res.blob())
                .then(blob => {
                    handleFileUpload(blob, drawingContext.productIndex, drawingContext.imageIndex);
                });
        }
        setIsDrawingOpen(false);
    };

    const removeImage = (productIndex: number, imageIndex: number) => {
        const currentImages = getValues(`materials.${productIndex}.referenceImages`) || [];
        const newImages = currentImages.filter((_, idx) => idx !== imageIndex);
        setValue(`materials.${productIndex}.referenceImages`, newImages);
    };

    const onSubmit = async (data: B2BFormValues) => {
        setIsSubmitting(true);
        try {
            await addDocumentNonBlocking(collection(firestore, 'orderRequests'), {
                ...data,
                status: 'pending',
                createdAt: serverTimestamp(),
            });
            setIsSubmitted(true);
        } catch (error) {
            console.error("Error submitting request:", error);
            toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not submit your request.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="bg-background pt-24 md:pt-48">
                <Header variant="solid" />
                <main className="container mx-auto py-12 sm:py-16 px-4 flex items-center justify-center">
                    <Card className="max-w-xl text-center">
                        <CardHeader>
                            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                            <CardTitle className="text-2xl sm:text-3xl mt-4">Request Submitted!</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Thank you for your inquiry. Our team will review your request and get back to you shortly. You can expect a response within 1-2 business days.</p>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={() => window.location.reload()}>Submit Another Request</Button>
                        </CardFooter>
                    </Card>
                </main>
            </div>
        )
    }

    const materialOptions = availableMaterials.map(m => ({ value: m.id, label: m.name }));

    return (
        <div className="bg-background pt-24 md:pt-48">
            <Header variant="solid" />

            <main className="container mx-auto py-12 sm:py-16 px-4">
                 <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-primary">Bulk & Customize Orders</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground">
                        Place a request for bulk quantities or custom-designed products tailored to your needs.
                    </p>
                </div>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Step 1: Choose Your Order Type</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={orderType} onValueChange={(value) => setOrderType(value as 'bulk' | 'customize')} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="bulk">Bulk Order</TabsTrigger>
                                    <TabsTrigger value="customize">Customize Order</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {orderType === 'bulk' ? (
                        <Card>
                             <CardHeader>
                                <CardTitle>Step 2: Enter Bulk Order Details</CardTitle>
                                <CardDescription>
                                     Specify the products you need in bulk by filling out the details below. You can add multiple products to a single request. Minimum order quantity is 100 units per product.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {fields.map((field, index) => (
                                     <div key={field.id} className="p-4 border rounded-lg space-y-4 relative bg-card">
                                         {fields.length > 1 && (
                                            <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => remove(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="space-y-2">
                                                <Label>Product Name</Label>
                                                <Input {...register(`materials.${index}.productName`)} placeholder="e.g., Round Jute Basket" />
                                            </div>
                                             <div className="space-y-2">
                                                <Label>Material</Label>
                                                <Input {...register(`materials.${index}.materialName`)} placeholder="e.g., Jute, Bamboo, Cane" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Quantity</Label>
                                                <Input type="number" {...register(`materials.${index}.quantity`, { valueAsNumber: true, min: MIN_BULK_QUANTITY })} />
                                                {errors.materials?.[index]?.quantity && <p className="text-sm text-destructive">{errors.materials[index].quantity.message}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Budget / piece (Optional)</Label>
                                                <Input type="number" {...register(`materials.${index}.budgetPerPiece`, { valueAsNumber: true })} placeholder="e.g., 500" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description (Optional)</Label>
                                            <Textarea {...register(`materials.${index}.description`)} placeholder="Add any specific details about the product here." rows={2}/>
                                        </div>
                                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="space-y-2">
                                                <Label>Height (Optional)</Label>
                                                <Input {...register(`materials.${index}.height`)} placeholder="e.g., 12cm" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Length (Optional)</Label>
                                                <Input {...register(`materials.${index}.length`)} placeholder="e.g., 20cm" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Width (Optional)</Label>
                                                <Input {...register(`materials.${index}.width`)} placeholder="e.g., 15cm" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Shape (Optional)</Label>
                                                <Input {...register(`materials.${index}.shape`)} placeholder="e.g., Round, Square" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Reference Images (Optional)</Label>
                                             <div className="flex flex-col sm:flex-row items-center gap-2">
                                                <Button type="button" variant="outline" className="w-full justify-center" onClick={() => { setUploadIndex(index); fileInputRef.current?.click(); }} disabled={isUploading || (watchedMaterials[index]?.referenceImages?.length ?? 0) >= 4}>
                                                    <UploadCloud className="mr-2 h-4 w-4" /> Upload Image
                                                </Button>
                                                 <Button type="button" variant="outline" className="w-full justify-center" onClick={() => { setDrawingContext({productIndex: index}); setIsDrawingOpen(true); }} disabled={(watchedMaterials[index]?.referenceImages?.length ?? 0) >= 4}>
                                                    <Wand2 className="mr-2 h-4 w-4" /> Draw & Add
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {watchedMaterials[index]?.referenceImages?.map((url, imgIndex) => (
                                                    <div key={imgIndex} className="relative group h-16 w-16 rounded-md overflow-hidden border">
                                                        <Image src={url} alt={`Reference ${imgIndex + 1}`} fill className="object-cover" />
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-white hover:bg-white/20"
                                                                onClick={() => { setDrawingContext({productIndex: index, imageIndex: imgIndex, imageUrl: url }); setIsDrawingOpen(true); }}
                                                            >
                                                                <Edit className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={() => removeImage(index, imgIndex)}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {(watchedMaterials[index]?.referenceImages?.length ?? 0) >= 4 && (
                                                <p className="text-xs text-destructive mt-1">Maximum of 4 images reached.</p>
                                            )}
                                        </div>
                                     </div>
                                ))}
                                <Button type="button" variant="outline" onClick={() => append({ 
                                    productName: '',
                                    materialId: 'bulk-material',
                                    materialName: '', 
                                    quantity: MIN_BULK_QUANTITY, 
                                    budgetPerPiece: undefined,
                                    description: '',
                                    height: '',
                                    length: '',
                                    width: '',
                                    shape: '',
                                    referenceImages: []
                                })}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Another Product
                                </Button>
                                {errors.materials?.root && <p className="text-sm text-destructive font-medium">{errors.materials.root.message}</p>}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Step 2: Select Materials & Quantity</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {fields.map((field, index) => {
                                    const selectedMaterialSetting = availableMaterials?.find(m => m.id === watchedMaterials[index]?.materialId);
                                    return (
                                        <div key={field.id} className="p-4 border rounded-lg space-y-4 relative bg-card">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Material</Label>
                                                    <Controller
                                                        control={control}
                                                        name={`materials.${index}.materialId`}
                                                        render={({ field }) => (
                                                            <Combobox
                                                                options={materialOptions}
                                                                value={field.value}
                                                                onChange={(val) => {
                                                                    const selectedMat = availableMaterials.find(m => m.id === val);
                                                                    setValue(`materials.${index}.materialId`, val);
                                                                    setValue(`materials.${index}.materialName`, selectedMat?.name || '');
                                                                }}
                                                                placeholder="Select a material"
                                                                searchPlaceholder="Search materials..."
                                                                notFoundMessage="No materials found."
                                                            />
                                                        )}
                                                    />
                                                    {errors.materials?.[index]?.materialId && <p className="text-sm text-destructive">{errors.materials[index].materialId.message}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Quantity {selectedMaterialSetting?.unit ? `(in ${selectedMaterialSetting.unit})` : ''}</Label>
                                                    <Input type="number" {...register(`materials.${index}.quantity`, { valueAsNumber: true })} />
                                                    {errors.materials?.[index]?.quantity && <p className="text-sm text-destructive">{errors.materials[index].quantity.message}</p>}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label>Customization Details</Label>
                                                    <Textarea placeholder="Describe your customization (size, color, design, etc.)" {...register(`materials.${index}.customizationDetails`)} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Reference Images (Optional)</Label>
                                                    <div className="flex items-center gap-4">
                                                        <Button type="button" variant="outline" onClick={() => { setUploadIndex(index); fileInputRef.current?.click(); }} disabled={isUploading || (watchedMaterials[index]?.referenceImages?.length ?? 0) >= 4}>
                                                            {isUploading && uploadIndex === index ? <PottersWheelSpinner /> : <><UploadCloud className="mr-2 h-4 w-4" /> Upload Image</>}
                                                        </Button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {watchedMaterials[index]?.referenceImages?.map((url, imgIndex) => (
                                                            <div key={imgIndex} className="relative group h-16 w-16 rounded-md overflow-hidden border">
                                                                <Image src={url} alt={`Reference ${imgIndex + 1}`} fill className="object-cover" />
                                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6 text-white hover:bg-white/20"
                                                                        onClick={() => { setDrawingContext({productIndex: index, imageIndex: imgIndex, imageUrl: url }); setIsDrawingOpen(true); }}
                                                                    >
                                                                        <Edit className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="destructive"
                                                                        size="icon"
                                                                        className="h-6 w-6"
                                                                        onClick={() => removeImage(index, imgIndex)}
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {fields.length > 1 && (
                                                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => remove(index)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    )
                                })}
                                <Button type="button" variant="outline" onClick={() => append({ materialId: '', materialName: '', quantity: 0, customizationDetails: '', referenceImages: [] })}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Another Material
                                </Button>
                                {errors.materials?.root && <p className="text-sm text-destructive font-medium">{errors.materials.root.message}</p>}
                            </CardContent>
                        </Card>
                    )}

                    {/* Shared file input */}
                    <input type="file" ref={fileInputRef} onChange={handleFileInputChange} className="hidden" accept="image/*"/>

                    <Card>
                        <CardHeader>
                             <CardTitle>Step 3: Your Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label>Delivery Timeline</Label>
                                <Input {...register('requirementDate')} placeholder="e.g., 2 weeks, 1 month, ASAP" />
                                {errors.requirementDate && <p className="text-sm text-destructive mt-2">{errors.requirementDate.message}</p>}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input {...register('customerDetails.name')} />
                                    {errors.customerDetails?.name && <p className="text-sm text-destructive">{errors.customerDetails.name.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Mobile Number</Label>
                                    <Input {...register('customerDetails.mobile')} />
                                    {errors.customerDetails?.mobile && <p className="text-sm text-destructive">{errors.customerDetails.mobile.message}</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Email (Optional)</Label>
                                    <Input {...register('customerDetails.email')} />
                                </div>
                                 <div className="space-y-2">
                                    <Label>State (Optional)</Label>
                                    <Input {...register('customerDetails.state')} />
                                </div>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>GST Number (Optional)</Label>
                                    <Input {...register('customerDetails.gstNumber')} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Total Budget (Optional)</Label>
                                    <Input type="number" {...register('customerDetails.totalBudget', { valueAsNumber: true })} placeholder="e.g., 50000" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" size="lg" disabled={isSubmitting}>
                            {isSubmitting ? <PottersWheelSpinner /> : 'Submit Request'}
                        </Button>
                    </div>
                </form>
            </main>
            <Dialog open={isDrawingOpen} onOpenChange={setIsDrawingOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Sketch Your Design</DialogTitle>
                    </DialogHeader>
                    <DrawingCanvas onSave={handleSaveDrawing} initialImage={drawingContext?.imageUrl} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
