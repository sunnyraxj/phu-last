
'use client';

import { useState, useMemo, Fragment, useEffect } from 'react';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { Header } from '@/components/shared/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Undo2, Info } from 'lucide-react';
import Link from 'next/link';
import { addDays, format, isBefore } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type OrderStatus = 'pending-payment-approval' | 'pending' | 'shipped' | 'delivered' | 'cancelled';
type ReturnStatus = 'none' | 'requested' | 'approved' | 'rejected' | 'refunded';


type ShippingDetails = {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
}

type Order = {
    id: string;
    orderDate: { seconds: number; nanoseconds: number; };
    totalAmount: number;
    status: OrderStatus;
    shippingDetails: ShippingDetails;
    returnStatus?: ReturnStatus;
    deliveryDate?: { seconds: number; };
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

export default function OrdersPage() {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    const ordersQuery = useMemoFirebase(
        () => (user && !user.isAnonymous ? query(collection(firestore, 'orders'), where('customerId', '==', user.uid)) : null),
        [firestore, user]
    );
    const { data: orders, isLoading: ordersLoading } = useCollection<Order>(ordersQuery);

    const orderIds = useMemo(() => orders?.map(o => o.id) || [], [orders]);

    const orderItemsQuery = useMemoFirebase(
        () => (orderIds.length > 0 ? query(collection(firestore, 'orderItems'), where('orderId', 'in', orderIds)) : null),
        [firestore, orderIds]
    );
    const { data: orderItems, isLoading: itemsLoading } = useCollection<OrderItem>(orderItemsQuery);

    useEffect(() => {
        if (!isUserLoading && (!user || user.isAnonymous)) {
            router.push('/login?redirect=/orders');
        }
    }, [user, isUserLoading, router]);

    const formatDate = (timestamp: { seconds: number }) => {
        if (!timestamp) return 'N/A';
        return format(new Date(timestamp.seconds * 1000), 'd MMMM yyyy');
    };
    
    const isReturnEligible = (timestamp: { seconds: number }) => {
        if (!timestamp) return false;
        // Return window is 3 days from the delivery date.
        const deliveryDate = new Date(timestamp.seconds * 1000);
        const returnDeadline = addDays(deliveryDate, 3);
        return isBefore(new Date(), returnDeadline);
    }

    const getStatusVariant = (status: Order['status']) => {
        switch (status) {
            case 'pending':
                return 'secondary';
            case 'pending-payment-approval':
                return 'destructive';
            case 'shipped':
                return 'default';
            case 'delivered':
                return 'outline';
            case 'cancelled':
                return 'outline';
            default:
                return 'secondary';
        }
    };
    
    if (isUserLoading || ordersLoading || itemsLoading || !user || user.isAnonymous) {
        return <div className="flex h-screen items-center justify-center"><PottersWheelSpinner /></div>;
    }

    return (
        <div className="bg-background">
            <Header userData={null} cartItems={[]} updateCartItemQuantity={() => {}} />

            <main className="container mx-auto py-8 sm:py-12 px-4">
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-8">My Orders</h1>

                {orders && orders.length > 0 ? (
                    <div className="space-y-6">
                        {orders.sort((a, b) => b.orderDate.seconds - a.orderDate.seconds).map(order => {
                            const itemsInOrder = orderItems?.filter(item => item.orderId === order.id) || [];
                            return (
                                <Collapsible key={order.id} asChild>
                                    <Card>
                                        <CollapsibleTrigger asChild>
                                            <div className="flex justify-between items-center p-4 cursor-pointer hover:bg-muted/50">
                                                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <p className="font-semibold text-muted-foreground">Order ID</p>
                                                        <p className="font-mono text-xs truncate">{order.id}</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-muted-foreground">Date</p>
                                                        <p>{formatDate(order.orderDate)}</p>
                                                    </div>
                                                     <div>
                                                        <p className="font-semibold text-muted-foreground">Status</p>
                                                        <Badge variant={getStatusVariant(order.status)} className="capitalize">{order.status.replace(/-/g, ' ')}</Badge>
                                                    </div>
                                                     <div>
                                                        <p className="font-semibold text-muted-foreground">Total</p>
                                                        <p className="font-semibold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.totalAmount)}</p>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm" className="w-9 p-0">
                                                    <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
                                                </Button>
                                            </div>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <div className="p-4 border-t">
                                                {order.returnStatus === 'approved' && (
                                                    <Alert className="mb-4">
                                                        <Info className="h-4 w-4" />
                                                        <AlertTitle>Return Approved</AlertTitle>
                                                        <AlertDescription>
                                                          Your return request has been approved. Your refund will be processed within 3 business days after we receive the returned item.
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div>
                                                        <h4 className="font-semibold mb-4 text-base">Order Items</h4>
                                                        {itemsInOrder.length > 0 ? (
                                                            <div className="space-y-4">
                                                                {itemsInOrder.map(item => (
                                                                    <div key={item.id} className="flex items-center gap-4 text-sm">
                                                                        <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted">
                                                                            {item.productImage ? <Image src={item.productImage} alt={item.productName} fill className="object-cover" /> : <div className="h-full w-full bg-muted"></div>}
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <p className="font-medium">{item.productName}</p>
                                                                            <p className="text-muted-foreground">Qty: {item.quantity}</p>
                                                                        </div>
                                                                        <p className="font-semibold">
                                                                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price * item.quantity)}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-muted-foreground text-sm">Loading items...</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold mb-4 text-base">Shipping & Delivery</h4>
                                                         {order.shippingDetails ? (
                                                            <div className="text-sm space-y-2">
                                                                <div>
                                                                    <p className="font-medium text-muted-foreground">Address</p>
                                                                    <p className="font-semibold">{order.shippingDetails.name}</p>
                                                                    <p className="text-muted-foreground">{order.shippingDetails.address}</p>
                                                                    <p className="text-muted-foreground">{order.shippingDetails.city}, {order.shippingDetails.state} {order.shippingDetails.pincode}</p>
                                                                    <p className="text-muted-foreground">{order.shippingDetails.phone}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-muted-foreground">Delivery Date</p>
                                                                    <p>{order.deliveryDate ? formatDate(order.deliveryDate) : `Est. by ${format(addDays(new Date(order.orderDate.seconds * 1000), 7), 'd MMM yyyy')}`}</p>
                                                                </div>
                                                            </div>
                                                        ): 'N/A'}
                                                    </div>
                                                </div>
                                                 <div className="flex justify-end gap-2 mt-6">
                                                    {order.status === 'delivered' && !order.returnStatus && (
                                                         <Link href={`/returns/request/${order.id}`}>
                                                            <Button variant="outline" size="sm" disabled={!order.deliveryDate || !isReturnEligible(order.deliveryDate)}>
                                                                <Undo2 className="mr-2 h-4 w-4" />
                                                                Request Return
                                                            </Button>
                                                        </Link>
                                                    )}
                                                     {order.returnStatus && order.returnStatus !== 'none' && (
                                                        <Badge variant={order.returnStatus === 'approved' ? 'default' : 'secondary'} className="capitalize">
                                                            Return {order.returnStatus.replace(/-/g, ' ')}
                                                        </Badge>
                                                     )}
                                                    <Link href={`/order-confirmation/${order.id}`} target="_blank">
                                                        <Button variant="outline" size="sm">View Invoice</Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </CollapsibleContent>
                                    </Card>
                                </Collapsible>
                            )
                        })}
                    </div>
                ) : (
                     <Card>
                        <CardContent className="p-12 text-center">
                            <h3 className="text-xl font-semibold">No Orders Yet</h3>
                            <p className="text-muted-foreground mt-2">You haven't placed any orders yet. Start shopping to see your orders here.</p>
                            <Link href="/purchase">
                                <Button className="mt-6">Continue Shopping</Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}
