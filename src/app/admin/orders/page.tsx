'use client';

import { useState, Fragment } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Image from 'next/image';

type OrderStatus = 'pending-payment-approval' | 'pending' | 'shipped' | 'delivered' | 'cancelled';

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
    customerId: string;
    orderDate: { seconds: number; nanoseconds: number; };
    totalAmount: number;
    status: OrderStatus;
    shippingDetails: ShippingDetails;
    paymentMethod?: 'UPI_PARTIAL';
    paymentDetails?: {
        advanceAmount: number;
        remainingAmount: number;
        utr: string;
        paymentPercentage: number;
    };
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
    const { toast } = useToast();
    const [orderToApprove, setOrderToApprove] = useState<Order | null>(null);
    const [orderToUpdateStatus, setOrderToUpdateStatus] = useState<{order: Order, newStatus: OrderStatus} | null>(null);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);


    const ordersQuery = useMemoFirebase(() => collection(firestore, 'orders'), [firestore]);
    const { data: orders, isLoading: ordersLoading } = useCollection<Order>(ordersQuery);

    const orderItemsQuery = useMemoFirebase(() => collection(firestore, 'orderItems'), [firestore]);
    const { data: orderItems, isLoading: itemsLoading } = useCollection<OrderItem>(orderItemsQuery);

    const formatDate = (timestamp: { seconds: number }) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
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
    }

    const handleApprovePayment = () => {
        if (!orderToApprove) return;
        const orderRef = doc(firestore, 'orders', orderToApprove.id);
        setDocumentNonBlocking(orderRef, { status: 'pending' }, { merge: true });
        toast({
            title: 'Payment Approved',
            description: `Order ${orderToApprove.id} has been moved to 'pending'.`
        });
        setOrderToApprove(null);
    }
    
    const updateOrderStatus = () => {
        if (!orderToUpdateStatus) return;

        const { order, newStatus } = orderToUpdateStatus;
        const orderRef = doc(firestore, 'orders', order.id);
        setDocumentNonBlocking(orderRef, { status: newStatus }, { merge: true });
        toast({
            title: 'Order Status Updated',
            description: `Order ${order.id} has been updated to '${newStatus.replace(/-/g, ' ')}'.`
        });
        setOrderToUpdateStatus(null);
    }

    const statusChangeOptions: OrderStatus[] = ['shipped', 'delivered', 'cancelled'];
    
    const isLoading = ordersLoading || itemsLoading;

    return (
        <div className="flex-1 space-y-4 p-2 sm:p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Customer Orders</CardTitle>
                    <CardDescription>
                        A list of all recent orders. Approve payments and manage order status.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead>Order Details</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Payment</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <PottersWheelSpinner />
                                        </TableCell>
                                    </TableRow>
                                ) : orders && orders.length > 0 ? (
                                    orders.map((order) => {
                                        const itemsInOrder = orderItems?.filter(item => item.orderId === order.id) || [];
                                        const isExpanded = expandedOrderId === order.id;
                                        return (
                                            <Fragment key={order.id}>
                                                <TableRow onClick={() => setExpandedOrderId(isExpanded ? null : order.id)} className="cursor-pointer">
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon">
                                                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell className="align-top pt-4">
                                                        <p className="font-mono text-xs">{order.id}</p>
                                                        <p className="text-muted-foreground text-xs">{formatDate(order.orderDate)}</p>
                                                    </TableCell>
                                                    <TableCell className="align-top pt-4">
                                                        {order.shippingDetails ? (
                                                            <div className="text-xs">
                                                                <p className="font-semibold">{order.shippingDetails.name}</p>
                                                                <p className="text-muted-foreground">{order.shippingDetails.address}</p>
                                                                <p className="text-muted-foreground">{order.shippingDetails.city}, {order.shippingDetails.state} {order.shippingDetails.pincode}</p>
                                                                <p className="text-muted-foreground">{order.shippingDetails.phone}</p>
                                                            </div>
                                                        ): 'N/A'}
                                                    </TableCell>
                                                    <TableCell className="align-top pt-4">
                                                        <Badge variant={getStatusVariant(order.status)} className="capitalize">{order.status.replace(/-/g, ' ')}</Badge>
                                                    </TableCell>
                                                    <TableCell className="align-top pt-4">
                                                        {order.paymentMethod === 'UPI_PARTIAL' && order.paymentDetails ? (
                                                            <div className="text-xs">
                                                                <p>UTR: <span className="font-mono">{order.paymentDetails.utr}</span></p>
                                                                <p>Paid: <span className="font-semibold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.paymentDetails.advanceAmount)}</span></p>
                                                                <p>Due: <span className="font-semibold text-destructive">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.paymentDetails.remainingAmount)}</span></p>
                                                            </div>
                                                        ) : 'Full Payment'}
                                                    </TableCell>
                                                    <TableCell className="text-right align-top pt-4">
                                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.totalAmount)}
                                                    </TableCell>
                                                    <TableCell className="text-right align-top pt-4">
                                                         <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                {order.status === 'pending-payment-approval' && (
                                                                    <>
                                                                        <DropdownMenuItem onClick={() => setOrderToApprove(order)}>
                                                                            Approve Payment
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                    </>
                                                                )}
                                                                {statusChangeOptions.map(status => (
                                                                     <DropdownMenuItem 
                                                                        key={status} 
                                                                        onClick={() => setOrderToUpdateStatus({order: order, newStatus: status})} 
                                                                        disabled={order.status === status}
                                                                        className="capitalize"
                                                                    >
                                                                        Mark as {status}
                                                                     </DropdownMenuItem>
                                                                ))}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                                {isExpanded && (
                                                    <TableRow>
                                                        <TableCell colSpan={7}>
                                                            <div className="p-4 bg-muted/50 rounded-md">
                                                                <h4 className="font-semibold mb-2">Order Items</h4>
                                                                {itemsInOrder.length > 0 ? (
                                                                    <div className="space-y-2">
                                                                        {itemsInOrder.map(item => (
                                                                            <div key={item.id} className="flex items-center gap-4 text-sm p-2 bg-background rounded">
                                                                                <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted">
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
                                                                    <p className="text-muted-foreground text-sm">No items found for this order.</p>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </Fragment>
                                        )
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            No orders found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            
            {/* Payment Approval Dialog */}
            <AlertDialog open={!!orderToApprove} onOpenChange={(isOpen) => !isOpen && setOrderToApprove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Approve Payment?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will confirm the advance payment and move the order to "Pending" status for processing. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setOrderToApprove(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleApprovePayment}>Approve</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            {/* Status Change Confirmation Dialog */}
            <AlertDialog open={!!orderToUpdateStatus} onOpenChange={(isOpen) => !isOpen && setOrderToUpdateStatus(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to change the status of this order to "{orderToUpdateStatus?.newStatus.replace(/-/g, ' ')}"?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setOrderToUpdateStatus(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={updateOrderStatus}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
