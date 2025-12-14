
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { Header } from '@/components/shared/Header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UploadCloud, X } from 'lucide-react';
import { useImageUploader } from '@/hooks/useImageUploader';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type OrderStatus = 'pending-payment-approval' | 'pending' | 'shipped' | 'delivered' | 'cancelled';

type Order = {
    id: string;
    customerId: string;
    orderDate: { seconds: number; nanoseconds: number; };
    status: OrderStatus;
};

type OrderItem = {
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    price: number;
    productName: string;
    productImage: string;
};

type ReturnItem = {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
}

export default function ReturnRequestPage() {
    const { orderId } = useParams();
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const { toast } = useToast();

    const [selectedItems, setSelectedItems] = useState<ReturnItem[]>([]);
    const [reason, setReason] = useState('');
    const [comments, setComments] = useState('');
    const [damageImages, setDamageImages] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        uploadFile,
        isUploading,
        uploadProgress,
        uploadedUrl,
        error: uploadError,
        clearUpload,
    } = useImageUploader('return_images');

    const orderRef = useMemoFirebase(() => doc(firestore, 'orders', orderId as string), [firestore, orderId]);
    const { data: order, isLoading: orderLoading } = useDoc<Order>(orderRef);

    const orderItemsQuery = useMemoFirebase(
        () => orderId ? query(collection(firestore, 'orderItems'), where('orderId', '==', orderId)) : null,
        [firestore, orderId]
    );
    const { data: orderItems, isLoading: itemsLoading } = useCollection<OrderItem>(orderItemsQuery);
    
    // Add new image URL to state when upload is complete
    useMemo(() => {
        if(uploadedUrl) {
            setDamageImages(prev => [...prev, uploadedUrl]);
            clearUpload();
        }
    }, [uploadedUrl, clearUpload]);

    const handleItemSelection = (item: OrderItem, checked: boolean) => {
        setSelectedItems(prev => {
            if (checked) {
                return [...prev, { productId: item.productId, productName: item.productName, quantity: item.quantity, price: item.price }];
            } else {
                return prev.filter(i => i.productId !== item.productId);
            }
        });
    };
    
    const handleSubmit = async () => {
        if (!user || !order) return;
        if (selectedItems.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select at least one item to return.' });
            return;
        }
        if (!reason) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a reason for the return.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const returnRequestData = {
                customerId: user.uid,
                orderId: order.id,
                requestDate: serverTimestamp(),
                status: 'pending-review',
                reason,
                customerComments: comments,
                items: selectedItems,
                damageImages,
            };
            
            await addDocumentNonBlocking(collection(firestore, 'returnRequests'), returnRequestData);
            
            // Also update the order to reflect the return request
            await addDocumentNonBlocking(orderRef, { returnStatus: 'requested' }, { merge: true });

            toast({ title: 'Return Request Submitted', description: "We've received your request and will review it shortly." });
            router.push('/orders');
        } catch (error) {
            console.error("Failed to submit return request:", error);
            toast({ variant: 'destructive', title: 'Submission Failed', description: 'There was a problem submitting your request.' });
        } finally {
            setIsSubmitting(false);
        }
    };


    const isLoading = isUserLoading || orderLoading || itemsLoading;

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><PottersWheelSpinner /></div>;
    }

    if (!user || (order && order.customerId !== user.uid)) {
        router.push('/login?redirect=/orders');
        return null;
    }
    
    if (!order) {
        return (
             <div className="flex h-screen items-center justify-center flex-col gap-4">
                <h2 className="text-2xl font-semibold">Order not found</h2>
                 <Button onClick={() => router.push('/orders')}>Back to My Orders</Button>
            </div>
        )
    }

    return (
        <div className="bg-background">
            <Header userData={null} cartItems={[]} updateCartItemQuantity={() => {}} />

            <main className="container mx-auto py-8 sm:py-12 px-4">
                <Card className="max-w-3xl mx-auto">
                    <CardHeader>
                        <CardTitle>Request a Return</CardTitle>
                        <CardDescription>For order <span className="font-mono text-sm">{order.id}</span></CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                         <div className="space-y-4">
                            <h3 className="font-semibold">Select Items to Return</h3>
                            {orderItems?.map(item => (
                                <div key={item.id} className="flex items-start gap-4 p-4 border rounded-md">
                                    <Checkbox 
                                        id={`item-${item.id}`}
                                        onCheckedChange={(checked) => handleItemSelection(item, !!checked)}
                                        className="mt-1"
                                    />
                                    <Label htmlFor={`item-${item.id}`} className="flex items-center gap-4 cursor-pointer flex-1">
                                         <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted">
                                            <Image src={item.productImage} alt={item.productName} fill className="object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{item.productName}</p>
                                            <p className="text-muted-foreground text-sm">Qty: {item.quantity}</p>
                                        </div>
                                         <p className="font-semibold text-sm">
                                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price * item.quantity)}
                                        </p>
                                    </Label>
                                </div>
                            ))}
                        </div>
                        
                        <div className="space-y-2">
                             <Label htmlFor="return-reason" className="font-semibold">Reason for Return</Label>
                             <Select onValueChange={setReason} value={reason}>
                                <SelectTrigger id="return-reason">
                                    <SelectValue placeholder="Select a reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="damaged-item">Item arrived damaged</SelectItem>
                                    <SelectItem value="wrong-item">Received wrong item</SelectItem>
                                    <SelectItem value="missing-parts">Missing parts or accessories</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                             </Select>
                        </div>
                        
                        <div className="space-y-2">
                             <Label htmlFor="return-comments" className="font-semibold">Comments</Label>
                             <Textarea 
                                id="return-comments" 
                                placeholder="Please provide details about the issue, especially for damaged items."
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                rows={4}
                             />
                        </div>
                        
                        <div className="space-y-2">
                             <Label className="font-semibold">Upload Images (optional)</Label>
                             <p className="text-xs text-muted-foreground">If your item is damaged, please upload clear photos.</p>
                             <ImageUploader
                                isUploading={isUploading}
                                uploadProgress={uploadProgress}
                                onFileUpload={uploadFile}
                                error={uploadError}
                             />
                             <div className="flex flex-wrap gap-2 mt-2">
                                {damageImages.map((url, index) => (
                                    <div key={index} className="relative h-20 w-20 rounded-md overflow-hidden border">
                                        <Image src={url} alt={`Damage image ${index + 1}`} fill className="object-cover" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-5 w-5 opacity-80 hover:opacity-100"
                                            onClick={() => setDamageImages(prev => prev.filter((_, i) => i !== index))}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                             </div>
                        </div>

                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? <PottersWheelSpinner /> : 'Submit Request'}
                        </Button>
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
}

// Reusable ImageUploader component for the page
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
            <div className="h-32 w-full rounded-md border border-dashed flex flex-col items-center justify-center p-4">
                <PottersWheelSpinner />
                <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
                <Progress value={uploadProgress} className="w-full mt-2" />
            </div>
        )
    }

    return (
        <div>
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                    "h-32 w-full rounded-md border-2 border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:border-primary transition-colors",
                    isDragging && "border-primary bg-primary/10"
                )}
                onClick={() => document.getElementById('image-upload-input-return')?.click()}
            >
                <UploadCloud className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                    Drag & drop images here, or click to select files
                </p>
                <input
                    id="image-upload-input-return"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                />
            </div>
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
    );
}

