
'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { Badge } from '@/components/ui/badge';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { IndianRupee, ShoppingCart, Users, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type OrderStatus = 'pending-payment-approval' | 'pending' | 'shipped' | 'delivered' | 'cancelled';

type Order = {
    id: string;
    orderDate: { seconds: number; nanoseconds: number; };
    totalAmount: number;
    status: OrderStatus;
    shippingDetails: {
        name: string;
    }
};

export default function DashboardPage() {
    const firestore = useFirestore();

    const ordersQuery = useMemoFirebase(() => collection(firestore, 'orders'), [firestore]);
    const { data: orders, isLoading: ordersLoading } = useCollection<Order>(ordersQuery);

    const recentOrdersQuery = useMemoFirebase(() => query(collection(firestore, 'orders'), orderBy('orderDate', 'desc'), limit(5)), [firestore]);
    const { data: recentOrders, isLoading: recentOrdersLoading } = useCollection<Order>(recentOrdersQuery);
    
    const { todayRevenue, monthRevenue, totalSales, salesByDay } = useMemo(() => {
        if (!orders) {
            return { todayRevenue: 0, monthRevenue: 0, totalSales: 0, salesByDay: [] };
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let todayRevenue = 0;
        let monthRevenue = 0;
        const deliveredOrders = orders.filter(o => o.status === 'delivered');
        
        const salesByDayData: { [key: string]: number } = {};

        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
            salesByDayData[dayStr] = 0;
        }

        deliveredOrders.forEach(order => {
            const orderDate = new Date(order.orderDate.seconds * 1000);
            if (orderDate >= today) {
                todayRevenue += order.totalAmount;
            }
            if (orderDate >= startOfMonth) {
                monthRevenue += order.totalAmount;
            }
            
            const timeDiff = now.getTime() - orderDate.getTime();
            const dayDiff = timeDiff / (1000 * 3600 * 24);

            if (dayDiff < 7) {
                const dayStr = orderDate.toLocaleDateString('en-US', { weekday: 'short' });
                salesByDayData[dayStr] = (salesByDayData[dayStr] || 0) + order.totalAmount;
            }
        });

        const salesByDay = Object.keys(salesByDayData).map(day => ({
            name: day,
            total: salesByDayData[day]
        })).reverse();


        return { todayRevenue, monthRevenue, totalSales: deliveredOrders.length, salesByDay };
    }, [orders]);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    
    const formatDate = (timestamp: { seconds: number }) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    }
    
    const getStatusVariant = (status: Order['status']) => {
        switch (status) {
            case 'pending': return 'secondary';
            case 'pending-payment-approval': return 'destructive';
            case 'shipped': return 'default';
            case 'delivered': return 'outline';
            case 'cancelled': return 'outline';
            default: return 'secondary';
        }
    }

    if (ordersLoading || recentOrdersLoading) {
        return (
             <div className="flex h-[calc(100vh-60px)] items-center justify-center">
                <PottersWheelSpinner />
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-4 p-2 sm:p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Today's Revenue
                        </CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(todayRevenue)}</div>
                        <p className="text-xs text-muted-foreground">
                            Total revenue from completed sales today.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            This Month's Revenue
                        </CardTitle>
                         <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(monthRevenue)}</div>
                         <p className="text-xs text-muted-foreground">
                            Total revenue from completed sales this month.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{totalSales}</div>
                        <p className="text-xs text-muted-foreground">
                           Total number of completed orders.
                        </p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Sales Overview</CardTitle>
                         <CardDescription>Sales from delivered orders in the last 7 days.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={salesByDay}>
                                <XAxis
                                    dataKey="name"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `₹${value / 1000}k`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                                    formatter={(value: number) => formatCurrency(value)}
                                />
                                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                 <Card className="col-span-4 lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Orders</CardTitle>
                        <CardDescription>
                            The last 5 orders placed.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentOrders && recentOrders.length > 0 ? (
                                    recentOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell>
                                                <div className="font-medium">{order.shippingDetails.name}</div>
                                            </TableCell>
                                            <TableCell>{formatDate(order.orderDate)}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(order.status)} className="capitalize">{order.status.replace(/-/g, ' ')}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">{formatCurrency(order.totalAmount)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                     <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No recent orders.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                         <div className="flex items-center justify-end pt-4">
                            <Link href="/admin/orders">
                                <Button size="sm" variant="outline">
                                    View All Orders
                                    <ArrowUpRight className="h-4 w-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
