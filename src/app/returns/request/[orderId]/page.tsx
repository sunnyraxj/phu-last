

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
import { sendReturnRequestConfirmation } from '@/lib/email';

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
    const [damageImageUrls, setDamageImageUrls] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const orderRef = useMemoFirebase(() => doc(firestore, 'orders', orderId as string), [firestore, orderId]);
    const { data: order, isLoading: orderLoading } = useDoc<Order>(orderRef);

    const orderItemsQuery = useMemoFirebase(
        () => orderId ? query(collection(firestore, 'orderItems'), where('orderId', '==', orderId)) : null,
        [firestore, orderId]
    );
    const { data: orderItems, isLoading: itemsLoading } = useCollection<OrderItem>(orderItemsQuery);
    
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
        if (!user || !order || !user.email) return;
        if (selectedItems.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select at least one item to return.' });
            return;
        }
        if (!reason) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a reason for the return.' });
            return;
        }
        
        const imageUrls = damageImageUrls.split('\n').filter(url => url.trim() !== '');


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
                damageImages: imageUrls,
            };
            
            await addDocumentNonBlocking(collection(firestore, 'returnRequests'), returnRequestData);
            
            // Also update the order to reflect the return request
            await addDocumentNonBlocking(doc(firestore, 'orders', order.id), { returnStatus: 'requested' }, { merge: true });

            await sendReturnRequestConfirmation({
                orderId: order.id,
                customerEmail: user.email,
                returnedItems: selectedItems.map(i => ({ name: i.productName, quantity: i.quantity })),
            });

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
            <Header />

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
                             <Label htmlFor="damage-images" className="font-semibold">Damage Image URLs (optional)</Label>
                             <p className="text-xs text-muted-foreground">If your item is damaged, please paste URLs to clear photos, one URL per line.</p>
                             <Textarea
                                id="damage-images"
                                placeholder="https://example.com/image1.jpg\nhttps://example.com/image2.jpg"
                                value={damageImageUrls}
                                onChange={(e) => setDamageImageUrls(e.target.value)}
                                rows={4}
                             />
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
