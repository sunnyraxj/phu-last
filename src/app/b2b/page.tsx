
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
import { Calendar as CalendarIcon, UploadCloud, Trash2, PlusCircle, CheckCircle } from 'lucide-react';
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

const MIN_BULK_QUANTITY = 100;

const materialRequestSchema = z.object({
  materialId: z.string().min(1, "Material must be selected"),
  materialName: z.string().min(1),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  customizationDetails: z.string().optional(),
  referenceImage: z.string().url().optional(),
});

const b2bRequestSchema = z.object({
    orderType: z.enum(['bulk', 'customize']),
    materials: z.array(materialRequestSchema).min(1, 'At least one material must be added.'),
    requirementDate: z.string({
        required_error: 'A delivery timeline is required.',
    }),
    customerDetails: z.object({
        name: z.string().min(1, 'Your name is required.'),
        mobile: z.string().min(10, 'A valid mobile number is required.'),
        email: z.string().email().optional().or(z.literal('')),
        companyName: z.string().optional(),
        gstNumber: z.string().optional(),
    }),
}).refine(data => {
    if (data.orderType === 'bulk') {
        return data.materials.every(m => m.quantity >= MIN_BULK_QUANTITY);
    }
    return true;
}, {
    message: `For bulk orders, each material must have a minimum quantity of ${MIN_BULK_QUANTITY}.`,
    path: ['materials'],
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

    const {
        control,
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<B2BFormValues>({
        resolver: zodResolver(b2bRequestSchema),
        defaultValues: {
            orderType: 'bulk',
            materials: [{ materialId: '', materialName: '', quantity: MIN_BULK_QUANTITY, customizationDetails: '', referenceImage: '' }],
            customerDetails: {
                name: '',
                mobile: '',
                email: '',
                companyName: '',
                gstNumber: '',
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
            { id: 'jute', name: 'Jute', unit: 'kg' },
        ];
        return coreMaterials;
    }, []);

    
    useEffect(() => {
        setValue('orderType', orderType);
    }, [orderType, setValue]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const response = await fetch(`/api/upload?filename=${file.name}`, {
                method: 'POST',
                body: file,
            });
            const newBlob = await response.json();
            if (newBlob.url) {
                const currentMaterial = watchedMaterials[index];
                update(index, { ...currentMaterial, referenceImage: newBlob.url });
                toast({ title: 'Image uploaded successfully!' });
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Upload failed', description: 'Could not upload image.' });
        } finally {
            setIsUploading(false);
            if (event.target) event.target.value = '';
        }
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
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-yellow-500">Bulk & Customize Orders</h1>
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
                                <CardDescription>Minimum order quantity for bulk orders is {MIN_BULK_QUANTITY} units per material.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <Label>Material</Label>
                                        <Controller
                                            control={control}
                                            name={`materials.0.materialId`}
                                            render={({ field }) => (
                                                <Combobox
                                                    options={materialOptions}
                                                    value={field.value}
                                                    onChange={(val) => {
                                                        const selectedMat = availableMaterials.find(m => m.id === val);
                                                        setValue(`materials.0.materialId`, val);
                                                        setValue(`materials.0.materialName`, selectedMat?.name || '');
                                                    }}
                                                    placeholder="Select a material"
                                                    searchPlaceholder="Search materials..."
                                                    notFoundMessage="No materials found."
                                                />
                                            )}
                                        />
                                         {errors.materials?.[0]?.materialId && <p className="text-sm text-destructive">{errors.materials[0].materialId.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Quantity</Label>
                                        <Input type="number" {...register(`materials.0.quantity`, { valueAsNumber: true })} />
                                        {errors.materials?.[0]?.quantity && <p className="text-sm text-destructive">{errors.materials[0].quantity.message}</p>}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Delivery Timeline</Label>
                                     <Controller
                                        control={control}
                                        name="requirementDate"
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a delivery timeline" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1 Week">1 Week</SelectItem>
                                                    <SelectItem value="2 Weeks">2 Weeks</SelectItem>
                                                    <SelectItem value="1 Month">1 Month</SelectItem>
                                                    <SelectItem value="2 Months">2 Months</SelectItem>
                                                    <SelectItem value="3+ Months">3+ Months</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.requirementDate && <p className="text-sm text-destructive mt-2">{errors.requirementDate.message}</p>}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Step 2: Select Materials & Quantity</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    
                                        <>
                                            {fields.map((field, index) => {
                                                const selectedMaterialSetting = availableMaterials?.find(m => m.id === watchedMaterials[index]?.materialId);
                                                return (
                                                    <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
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
                                                                <Label>Reference Image (Optional)</Label>
                                                                <div className="flex items-center gap-4">
                                                                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                                                                        {isUploading ? <PottersWheelSpinner /> : <><UploadCloud className="mr-2 h-4 w-4" /> Upload Image</>}
                                                                    </Button>
                                                                    {watchedMaterials[index]?.referenceImage && (
                                                                        <a href={watchedMaterials[index].referenceImage} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline truncate">
                                                                            {watchedMaterials[index].referenceImage.split('/').pop()}
                                                                        </a>
                                                                    )}
                                                                    <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, index)} className="hidden" accept="image/*"/>
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
                                            <Button type="button" variant="outline" onClick={() => append({ materialId: '', materialName: '', quantity: 0, customizationDetails: '', referenceImage: '' })}>
                                                <PlusCircle className="mr-2 h-4 w-4" /> Add Another Material
                                            </Button>
                                            {errors.materials?.root && <p className="text-sm text-destructive font-medium">{errors.materials.root.message}</p>}
                                        </>
                                    
                                </CardContent>
                            </Card>

                             <Card>
                                <CardHeader>
                                    <CardTitle>Step 3: Delivery Timeline</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Controller
                                        control={control}
                                        name="requirementDate"
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a delivery timeline" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1 Week">1 Week</SelectItem>
                                                    <SelectItem value="2 Weeks">2 Weeks</SelectItem>
                                                    <SelectItem value="1 Month">1 Month</SelectItem>
                                                    <SelectItem value="2 Months">2 Months</SelectItem>
                                                    <SelectItem value="3+ Months">3+ Months</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.requirementDate && <p className="text-sm text-destructive mt-2">{errors.requirementDate.message}</p>}
                                </CardContent>
                            </Card>
                        </>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Step {orderType === 'bulk' ? '3' : '4'}: Your Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                            <div className="space-y-2">
                                <Label>Email (Optional)</Label>
                                <Input {...register('customerDetails.email')} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Company / Shop Name (Optional)</Label>
                                    <Input {...register('customerDetails.companyName')} />
                                </div>
                                <div className="space-y-2">
                                    <Label>GST Number (Optional)</Label>
                                    <Input {...register('customerDetails.gstNumber')} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" size="lg" disabled={isSubmitting} className="bg-yellow-400 text-black hover:bg-yellow-500">
                            {isSubmitting ? <PottersWheelSpinner /> : 'Submit Request'}
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    );
}
