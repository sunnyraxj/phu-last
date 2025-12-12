'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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

export default function OrdersPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [orderToApprove, setOrderToApprove] = useState<Order | null>(null);

    const ordersQuery = useMemoFirebase(() => collection(firestore, 'orders'), [firestore]);
    const { data: orders, isLoading: ordersLoading } = useCollection<Order>(ordersQuery);

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
    
    const updateOrderStatus = (order: Order, newStatus: OrderStatus) => {
        const orderRef = doc(firestore, 'orders', order.id);
        setDocumentNonBlocking(orderRef, { status: newStatus }, { merge: true });
        toast({
            title: 'Order Status Updated',
            description: `Order ${order.id} has been updated to '${newStatus.replace(/-/g, ' ')}'.`
        });
    }

    const statusChangeOptions: OrderStatus[] = ['shipped', 'delivered', 'cancelled'];

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
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Payment</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ordersLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <PottersWheelSpinner />
                                        </TableCell>
                                    </TableRow>
                                ) : orders && orders.length > 0 ? (
                                    orders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono text-xs align-top pt-4">{order.id}</TableCell>
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
                                            <TableCell className="align-top pt-4">{formatDate(order.orderDate)}</TableCell>
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
                                                        <Button variant="ghost" size="icon">
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
                                                                onClick={() => updateOrderStatus(order, status)} 
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
                                    ))
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
        </div>
    );
}
