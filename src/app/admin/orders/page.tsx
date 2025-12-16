

'use client';

import { useState, Fragment, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, ChevronDown, ChevronUp, Calendar as CalendarIcon, Search, FileText, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

type OrderStatus = 'pending-payment-approval' | 'pending' | 'shipped' | 'delivered' | 'cancelled'|'order-confirmed';

type ShippingDetails = {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    email?: string;
}

type Order = {
    id: string;
    customerId: string;
    orderDate: { seconds: number; nanoseconds: number; };
    deliveryDate?: { seconds: number; nanoseconds: number; };
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
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const [orderToApprove, setOrderToApprove] = useState<Order | null>(null);
    const [orderToUpdateStatus, setOrderToUpdateStatus] = useState<{order: Order, newStatus: OrderStatus} | null>(null);
    const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [itemsByOrder, setItemsByOrder] = useState<{[key: string]: OrderItem[]}>({});
    
    const orderIdsToFetch = useMemo(() => expandedOrderIds.filter(id => !itemsByOrder[id]), [expandedOrderIds, itemsByOrder]);

    const itemsQuery = useMemoFirebase(
      () =>
        orderIdsToFetch.length > 0
          ? query(
              collection(firestore, 'orderItems'),
              where('orderId', 'in', orderIdsToFetch)
            )
          : null,
      [firestore, orderIdsToFetch]
    );

    const { data: fetchedItems, isLoading: itemsLoading } = useCollection<OrderItem>(itemsQuery);

    useEffect(() => {
        if (fetchedItems) {
            const newItemsByOrder = { ...itemsByOrder };
            fetchedItems.forEach(item => {
                if (!newItemsByOrder[item.orderId]) {
                    newItemsByOrder[item.orderId] = [];
                }
                if (!newItemsByOrder[item.orderId].find(i => i.id === item.id)) {
                  newItemsByOrder[item.orderId].push(item);
                }
            });
            setItemsByOrder(newItemsByOrder);
        }
    }, [fetchedItems, itemsByOrder]);


    const userDocRef = useMemoFirebase(() => (user && !user.isAnonymous ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
    const { data: userData, isLoading: isUserDocLoading } = useDoc<{ role: string }>(userDocRef);
    const isAuthorizedAdmin = userData?.role === 'admin';

    const ordersQuery = useMemoFirebase(() => 
        isAuthorizedAdmin ? query(collection(firestore, 'orders')) : null, 
    [firestore, isAuthorizedAdmin]);
    const { data: allOrders, isLoading: ordersLoading } = useCollection<Order>(ordersQuery);
    
    const filteredOrders = useMemo(() => {
        if (!allOrders) return [];
        if (!searchTerm) return allOrders;
        
        const lowercasedFilter = searchTerm.toLowerCase();
        return allOrders.filter(order =>
            order.id.toLowerCase().includes(lowercasedFilter) ||
            order.shippingDetails.name.toLowerCase().includes(lowercasedFilter)
        );
    }, [allOrders, searchTerm]);

    const orders = useMemo(() => {
        const source = filteredOrders;
        if (!source) return { pending: [], shipped: [], delivered: [], archived: [] };
        const pending = source.filter(o => o.status === 'pending' || o.status === 'pending-payment-approval' || o.status === 'order-confirmed');
        const shipped = source.filter(o => o.status === 'shipped');
        const delivered = source.filter(o => o.status === 'delivered');
        const archived = source.filter(o => o.status === 'cancelled');
        return { pending, shipped, delivered, archived };
    }, [filteredOrders]);

    const formatDate = (timestamp?: { seconds: number }) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    const getStatusVariant = (status: Order['status']) => {
        switch (status) {
            case 'pending':
                return 'secondary';
            case 'order-confirmed':
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
        const newStatus = 'order-confirmed';
        setDocumentNonBlocking(orderRef, { status: newStatus }, { merge: true });
        
        toast({
            title: 'Payment Approved',
            description: `Order ${orderToApprove.id.substring(0,8)} has been moved to 'order-confirmed'.`
        });
        setOrderToApprove(null);
    }
    
    const updateOrderStatus = () => {
        if (!orderToUpdateStatus) return;

        const { order, newStatus } = orderToUpdateStatus;
        const orderRef = doc(firestore, 'orders', order.id);
        
        const updateData: { status: OrderStatus; deliveryDate?: Date } = { status: newStatus };
        if (newStatus === 'delivered' && !order.deliveryDate) {
            updateData.deliveryDate = new Date();
        }

        setDocumentNonBlocking(orderRef, updateData, { merge: true });
        
        toast({
            title: 'Order Status Updated',
            description: `Order ${order.id.substring(0,8)} has been updated to '${newStatus.replace(/-/g, ' ')}'.`
        });
        setOrderToUpdateStatus(null);
    }

    const updateDeliveryDate = (order: Order, date: Date | undefined) => {
        if (!date) return;
        const orderRef = doc(firestore, 'orders', order.id);
        setDocumentNonBlocking(orderRef, { deliveryDate: date }, { merge: true });
        toast({
            title: "Delivery Date Updated",
            description: `Delivery date for order ${order.id.substring(0,8)} set to ${formatDate({ seconds: date.getTime() / 1000 })}.`
        });
    }

    const toggleExpand = (orderId: string) => {
        setExpandedOrderIds(prev => prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]);
    }

    const statusChangeOptions: OrderStatus[] = ['order-confirmed', 'shipped', 'delivered', 'cancelled'];
    
    const isLoading = isUserLoading || isUserDocLoading || (isAuthorizedAdmin && ordersLoading);

    const OrderTable = ({ orders, emptyMessage }: { orders: Order[] | undefined, emptyMessage: string }) => (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Order Details</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                <PottersWheelSpinner />
                            </TableCell>
                        </TableRow>
                    ) : orders && orders.length > 0 ? (
                        orders.map((order) => {
                            const itemsInOrder = itemsByOrder[order.id] || [];
                            const isExpanded = expandedOrderIds.includes(order.id);
                            return (
                                <Fragment key={order.id}>
                                    <TableRow className={cn("align-top", isExpanded && "bg-muted/50")}>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => toggleExpand(order.id)}
                                                className="h-8 w-8"
                                            >
                                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </Button>
                                        </TableCell>
                                        <TableCell className="pt-3">
                                            <p className="font-mono text-xs">{order.id}</p>
                                            <p className="text-muted-foreground text-xs">{formatDate(order.orderDate)}</p>
                                        </TableCell>
                                        <TableCell className="pt-3">
                                            <p className="font-semibold">{order.shippingDetails?.name || 'N/A'}</p>
                                        </TableCell>
                                        <TableCell className="pt-3">
                                            <Badge variant={getStatusVariant(order.status)} className="capitalize">{order.status.replace(/-/g, ' ')}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right pt-3 font-semibold">
                                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.totalAmount)}
                                        </TableCell>
                                        <TableCell className="text-right pt-3">
                                             <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/order-confirmation/${order.id}`} target="_blank">
                                                            <FileText className="mr-2 h-4 w-4" />
                                                            View Invoice
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    {(order.status === 'order-confirmed' || order.status === 'shipped' || order.status === 'delivered') && (
                                                         <DropdownMenuItem asChild>
                                                            <Link href={`/admin/orders/label/${order.id}`} target="_blank">
                                                                <Printer className="mr-2 h-4 w-4" />
                                                                Print Label
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    )}
                                                    {order.status === 'pending-payment-approval' && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => setOrderToApprove(order)}>
                                                                Confirm Payment
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    {statusChangeOptions.map(status => (
                                                         <DropdownMenuItem 
                                                            key={status} 
                                                            onClick={() => setOrderToUpdateStatus({order: order, newStatus: status})} 
                                                            disabled={order.status === status}
                                                            className="capitalize"
                                                        >
                                                            Mark as {status.replace(/-/g, ' ')}
                                                         </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                    {isExpanded && (
                                        <TableRow>
                                            <TableCell colSpan={6}>
                                                <div className="p-4 bg-muted/50 rounded-md grid md:grid-cols-2 gap-6">
                                                     <div>
                                                        <h4 className="font-semibold mb-2">Order Items</h4>
                                                        {itemsLoading && orderIdsToFetch.includes(order.id) ? (
                                                          <PottersWheelSpinner />
                                                        ) : itemsInOrder.length > 0 ? (
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
                                                    <div className="space-y-4">
                                                        <div>
                                                            <h4 className="font-semibold mb-2">Shipping Address</h4>
                                                            {order.shippingDetails ? (
                                                                <div className="text-xs">
                                                                    <p className="font-semibold">{order.shippingDetails.name}</p>
                                                                    <p className="text-muted-foreground">{order.shippingDetails.address}</p>
                                                                    <p className="text-muted-foreground">{order.shippingDetails.city}, {order.shippingDetails.state} {order.shippingDetails.pincode}</p>
                                                                    <p className="text-muted-foreground">{order.shippingDetails.phone}</p>
                                                                </div>
                                                            ): 'N/A'}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold mb-2">Payment Details</h4>
                                                            {order.paymentMethod === 'UPI_PARTIAL' && order.paymentDetails ? (
                                                                <div className="text-xs space-y-1">
                                                                    <p>Method: <span className="font-semibold">Partial UPI</span></p>
                                                                    <p>UTR: <span className="font-mono">{order.paymentDetails.utr}</span></p>
                                                                    <p>Paid: <span className="font-semibold text-green-600">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.paymentDetails.advanceAmount)}</span></p>
                                                                    <p>Due: <span className="font-semibold text-destructive">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.paymentDetails.remainingAmount)}</span></p>
                                                                </div>
                                                            ) : <p className="text-xs">Full Payment</p>}
                                                        </div>
                                                         <div>
                                                            <h4 className="font-semibold mb-2">Delivery Date</h4>
                                                            <div className="flex items-center gap-4">
                                                                <p className={cn("text-lg font-bold", !order.deliveryDate && "text-muted-foreground font-normal text-sm")}>
                                                                    {order.deliveryDate ? formatDate(order.deliveryDate) : 'Not set'}
                                                                </p>
                                                                <Popover>
                                                                    <PopoverTrigger asChild>
                                                                        <Button variant="outline" size="sm" className="h-8">
                                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                                            <span>{order.deliveryDate ? "Change" : "Set"} Date</span>
                                                                        </Button>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-auto p-0">
                                                                        <Calendar
                                                                            mode="single"
                                                                            selected={order.deliveryDate ? new Date(order.deliveryDate.seconds * 1000) : undefined}
                                                                            onSelect={(date) => updateDeliveryDate(order, date)}
                                                                            initialFocus
                                                                        />
                                                                    </PopoverContent>
                                                                </Popover>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </Fragment>
                            )
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                {emptyMessage}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <div className="flex-1 space-y-4 p-2 sm:p-4 md:p-8 pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
            </div>
            
            <Tabs defaultValue="pending">
                 <div className="flex flex-col sm:flex-row items-center justify-between space-y-2">
                    <TabsList>
                        <TabsTrigger value="pending">Pending <Badge variant={orders.pending.length > 0 ? "default" : "outline"} className="ml-2">{orders.pending.length}</Badge></TabsTrigger>
                        <TabsTrigger value="shipped">Shipped <Badge variant={orders.shipped.length > 0 ? "default" : "outline"} className="ml-2">{orders.shipped.length}</Badge></TabsTrigger>
                        <TabsTrigger value="delivered">Delivered <Badge variant={orders.delivered.length > 0 ? "default" : "outline"} className="ml-2">{orders.delivered.length}</Badge></TabsTrigger>
                        <TabsTrigger value="archived">Archived</TabsTrigger>
                    </TabsList>
                    <div className="relative w-full sm:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search by Order ID or Customer Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
                <TabsContent value="pending" className="mt-4">
                     <Card>
                        <CardHeader>
                            <CardTitle>Pending Orders</CardTitle>
                            <CardDescription>
                                Orders that need payment approval or are ready to be shipped.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <OrderTable orders={orders.pending} emptyMessage="No pending orders." />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="shipped" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Shipped Orders</CardTitle>
                            <CardDescription>
                                Orders that are currently in transit to the customer.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <OrderTable orders={orders.shipped} emptyMessage="No shipped orders." />
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="delivered" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Delivered Orders</CardTitle>
                            <CardDescription>
                                Orders that have been successfully delivered to the customer.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <OrderTable orders={orders.delivered} emptyMessage="No delivered orders." />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="archived" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Archived Orders</CardTitle>
                            <CardDescription>
                                Orders that have been cancelled.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <OrderTable orders={orders.archived} emptyMessage="No archived orders." />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            
            {/* Payment Approval Dialog */}
            <AlertDialog open={!!orderToApprove} onOpenChange={(isOpen) => !isOpen && setOrderToApprove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Approve Payment?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will confirm the advance payment and move the order to "Confirmed" status for processing. An email will be sent to the customer. This action cannot be undone.
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
                            {(orderToUpdateStatus?.newStatus === 'shipped' || orderToUpdateStatus?.newStatus === 'delivered' || orderToUpdateStatus?.newStatus === 'order-confirmed') && ' An email notification will be sent to the customer.'}
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

    

    

    


