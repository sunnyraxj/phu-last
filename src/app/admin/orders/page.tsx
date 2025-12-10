'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { Badge } from '@/components/ui/badge';

type Order = {
    id: string;
    customerId: string;
    orderDate: { seconds: number; nanoseconds: number; };
    totalAmount: number;
    status: 'pending' | 'shipped' | 'delivered';
};

export default function OrdersPage() {
    const firestore = useFirestore();
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
            case 'shipped':
                return 'default';
            case 'delivered':
                return 'outline';
            default:
                return 'secondary';
        }
    }

    return (
        <div className="flex-1 space-y-4 p-2 sm:p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Customer Orders</CardTitle>
                    <CardDescription>
                        A list of all recent orders.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Customer ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ordersLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <PottersWheelSpinner />
                                        </TableCell>
                                    </TableRow>
                                ) : orders && orders.length > 0 ? (
                                    orders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono text-xs">{order.id}</TableCell>
                                            <TableCell className="font-mono text-xs">{order.customerId}</TableCell>
                                            <TableCell>{formatDate(order.orderDate)}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(order.status)} className="capitalize">{order.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.totalAmount)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No orders found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
