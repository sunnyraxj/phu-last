
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ExternalLink, ThumbsUp, ThumbsDown, CircleCheck, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import Link from 'next/link';

type ReturnStatus = 'pending-review' | 'approved' | 'rejected' | 'refunded';

type ReturnRequest = {
    id: string;
    orderId: string;
    customerId: string;
    requestDate: { seconds: number; nanoseconds: number; };
    reason: string;
    status: ReturnStatus;
    items: {
        productId: string;
        productName: string;
        quantity: number;
        price: number;
    }[];
    customerComments: string;
    damageImages?: string[];
};

export default function ReturnsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [requestToUpdate, setRequestToUpdate] = useState<{ request: ReturnRequest; newStatus: 'approved' | 'rejected' | 'refunded' } | null>(null);

    const returnsQuery = useMemoFirebase(() => collection(firestore, 'returnRequests'), [firestore]);
    const { data: allReturns, isLoading: returnsLoading } = useCollection<ReturnRequest>(returnsQuery);

    const returns = useMemo(() => {
        if (!allReturns) return { pending: [], approved: [], rejected: [], refunded: [] };
        const pending = allReturns.filter(r => r.status === 'pending-review');
        const approved = allReturns.filter(r => r.status === 'approved');
        const rejected = allReturns.filter(r => r.status === 'rejected');
        const refunded = allReturns.filter(r => r.status === 'refunded');
        return { pending, approved, rejected, refunded };
    }, [allReturns]);

    const formatDate = (timestamp: { seconds: number }) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const getStatusVariant = (status: ReturnStatus) => {
        switch (status) {
            case 'pending-review':
                return 'destructive';
            case 'approved':
                return 'default';
            case 'rejected':
                return 'secondary';
            case 'refunded':
                return 'outline';
            default:
                return 'outline';
        }
    };

    const handleUpdateStatus = () => {
        if (!requestToUpdate) return;
        const { request, newStatus } = requestToUpdate;
        const returnRef = doc(firestore, 'returnRequests', request.id);
        
        // Also update the parent order's returnStatus
        const orderRef = doc(firestore, 'orders', request.orderId);

        setDocumentNonBlocking(returnRef, { status: newStatus }, { merge: true });
        setDocumentNonBlocking(orderRef, { returnStatus: newStatus }, { merge: true });

        toast({
            title: 'Return Request Updated',
            description: `Request for order ${request.orderId} has been ${newStatus}.`
        });
        setRequestToUpdate(null);
    };

    const ReturnRequestTable = ({ requests, emptyMessage, currentTab }: { requests: ReturnRequest[] | undefined, emptyMessage: string, currentTab: ReturnStatus | 'pending-review' }) => (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Request Date</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Comments & Images</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {returnsLoading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                <PottersWheelSpinner />
                            </TableCell>
                        </TableRow>
                    ) : requests && requests.length > 0 ? (
                        requests.map(req => (
                            <TableRow key={req.id}>
                                <TableCell className="font-mono text-xs">{req.orderId}</TableCell>
                                <TableCell>{formatDate(req.requestDate)}</TableCell>
                                <TableCell className="capitalize">{req.reason.replace(/-/g, ' ')}</TableCell>
                                <TableCell>
                                    <p className="text-sm max-w-xs">{req.customerComments}</p>
                                    {req.damageImages && req.damageImages.length > 0 && (
                                        <div className="flex gap-2 mt-2">
                                            {req.damageImages.map((img, index) => (
                                                <Link key={index} href={img} target="_blank" rel="noopener noreferrer">
                                                    <div className="relative h-10 w-10 rounded-md overflow-hidden border hover:opacity-80">
                                                        <Image src={img} alt={`Damage image ${index + 1}`} fill className="object-cover" />
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1 text-xs">
                                        {req.items.map(item => (
                                            <div key={item.productId}>{item.productName} (x{item.quantity})</div>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    {req.status === 'pending-review' && (
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setRequestToUpdate({ request: req, newStatus: 'approved' })}>
                                                <ThumbsUp className="h-4 w-4 mr-2" />Approve
                                            </Button>
                                             <Button variant="destructive" size="sm" onClick={() => setRequestToUpdate({ request: req, newStatus: 'rejected' })}>
                                                <ThumbsDown className="h-4 w-4 mr-2" />Reject
                                            </Button>
                                        </div>
                                    )}
                                    {req.status === 'approved' && (
                                         <Button variant="default" size="sm" onClick={() => setRequestToUpdate({ request: req, newStatus: 'refunded' })}>
                                            <Wallet className="h-4 w-4 mr-2" />Mark as Refunded
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
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
        <div className="space-y-4">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Return Requests</h2>
            </div>

            <Tabs defaultValue="pending">
                <TabsList>
                    <TabsTrigger value="pending">Pending Review <Badge variant={returns.pending.length > 0 ? "destructive" : "outline"} className="ml-2">{returns.pending.length}</Badge></TabsTrigger>
                    <TabsTrigger value="approved">Approved <Badge variant={returns.approved.length > 0 ? "default" : "outline"} className="ml-2">{returns.approved.length}</Badge></TabsTrigger>
                    <TabsTrigger value="rejected">Rejected <Badge variant={returns.rejected.length > 0 ? "default" : "outline"} className="ml-2">{returns.rejected.length}</Badge></TabsTrigger>
                     <TabsTrigger value="refunded">Refunded <Badge variant={returns.refunded.length > 0 ? "default" : "outline"} className="ml-2">{returns.refunded.length}</Badge></TabsTrigger>
                </TabsList>
                 <TabsContent value="pending" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Review</CardTitle>
                            <CardDescription>
                                These return requests need to be reviewed and actioned.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <ReturnRequestTable requests={returns.pending} emptyMessage="No pending return requests." currentTab="pending-review" />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="approved" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Approved Returns</CardTitle>
                            <CardDescription>
                                These returns are approved. Mark as refunded after processing the refund.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <ReturnRequestTable requests={returns.approved} emptyMessage="No approved return requests." currentTab="approved" />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="rejected" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Rejected Returns</CardTitle>
                            <CardDescription>
                                These return requests have been rejected.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <ReturnRequestTable requests={returns.rejected} emptyMessage="No rejected return requests." currentTab="rejected" />
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="refunded" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Refunded Returns</CardTitle>
                            <CardDescription>
                                These return requests have been successfully refunded.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <ReturnRequestTable requests={returns.refunded} emptyMessage="No refunded returns." currentTab="refunded" />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <AlertDialog open={!!requestToUpdate} onOpenChange={(isOpen) => !isOpen && setRequestToUpdate(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Action</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to <span className="font-bold">{requestToUpdate?.newStatus}</span> this return request? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setRequestToUpdate(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleUpdateStatus} className={requestToUpdate?.newStatus === 'rejected' ? 'bg-destructive hover:bg-destructive/90' : ''}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
