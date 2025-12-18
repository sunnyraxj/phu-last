
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
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Input } from '@/components/ui/input';

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
    const [imageUrl, setImageUrl] = useState('');


    const orderRef = useMemoFirebase(() => doc(firestore, 'orders', orderId as string), [firestore, orderId]);
    const { data: order, isLoading: orderLoading } = useDoc<Order>(orderRef);

    const orderItemsQuery = useMemoFirebase(
        () => orderId ? query(collection(firestore, 'orderItems'), where('orderId', '==', orderId)) : null,
        [firestore, orderId]
    );
    const { data: orderItems, isLoading: itemsLoading } = useCollection<OrderItem>(orderItemsQuery);
    
    const handleAddImageUrl = () => {
        if (imageUrl) {
            try {
                new URL(imageUrl); // Basic URL validation
                setDamageImages(prev => [...prev, imageUrl]);
                setImageUrl('');
            } catch {
                toast({
                    variant: 'destructive',
                    title: 'Invalid URL',
                    description: 'Please enter a valid image URL.'
                });
            }
        }
    };

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
                             <Label className="font-semibold">Add Image URLs (optional)</Label>
                             <p className="text-xs text-muted-foreground">If your item is damaged, please provide links to clear photos.</p>
                              <div className="flex items-center gap-2">
                                <Input
                                    type="text"
                                    placeholder="https://example.com/image.jpg"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                />
                                <Button type="button" variant="outline" onClick={handleAddImageUrl}>Add</Button>
                            </div>
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
