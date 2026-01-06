
'use client';

import { useState, useMemo, Fragment } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

type RequestStatus = 'pending' | 'approved' | 'rejected';

type OrderRequest = {
    id: string;
    orderType: 'bulk' | 'customize';
    requirementDate: string;
    createdAt: { seconds: number; nanoseconds: number; };
    status: RequestStatus;
    customerDetails: {
        name: string;
        mobile: string;
        email?: string;
        companyName?: string;
        gstNumber?: string;
    };
    materials: {
        materialName: string;
        quantity: number;
        customizationDetails?: string;
        referenceImage?: string;
    }[];
    adminNote?: string;
};

export default function RequestsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [requestToUpdate, setRequestToUpdate] = useState<{ request: OrderRequest; newStatus: 'approved' | 'rejected' } | null>(null);
    const [requestToNote, setRequestToNote] = useState<OrderRequest | null>(null);
    const [adminNote, setAdminNote] = useState('');
    const [expandedRequestIds, setExpandedRequestIds] = useState<string[]>([]);

    const requestsQuery = useMemoFirebase(() => collection(firestore, 'orderRequests'), [firestore]);
    const { data: allRequests, isLoading: requestsLoading } = useCollection<OrderRequest>(requestsQuery);

    const requests = useMemo(() => {
        if (!allRequests) return { pending: [], approved: [], rejected: [] };
        return {
            pending: allRequests.filter(r => r.status === 'pending'),
            approved: allRequests.filter(r => r.status === 'approved'),
            rejected: allRequests.filter(r => r.status === 'rejected'),
        };
    }, [allRequests]);

    const formatDate = (timestamp?: { seconds: number }) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const handleUpdateStatus = () => {
        if (!requestToUpdate) return;
        const { request, newStatus } = requestToUpdate;
        const requestRef = doc(firestore, 'orderRequests', request.id);
        
        setDocumentNonBlocking(requestRef, { status: newStatus }, { merge: true });

        toast({
            title: 'Request Updated',
            description: `Request from ${request.customerDetails.name} has been ${newStatus}.`
        });
        setRequestToUpdate(null);
    };
    
    const handleSaveNote = () => {
        if (!requestToNote) return;
        const requestRef = doc(firestore, 'orderRequests', requestToNote.id);
        setDocumentNonBlocking(requestRef, { adminNote }, { merge: true });
        toast({ title: 'Note Saved' });
        setRequestToNote(null);
        setAdminNote('');
    };
    
    const toggleExpand = (requestId: string) => {
        setExpandedRequestIds(prev => prev.includes(requestId) ? prev.filter(id => id !== requestId) : [...prev, requestId]);
    }

    const RequestTable = ({ requests, emptyMessage }: { requests: OrderRequest[] | undefined, emptyMessage: string }) => (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requestsLoading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                <PottersWheelSpinner />
                            </TableCell>
                        </TableRow>
                    ) : requests && requests.length > 0 ? (
                        requests.map((req) => {
                            const isExpanded = expandedRequestIds.includes(req.id);
                            return (
                                <Fragment key={req.id}>
                                    <TableRow className="align-top">
                                         <TableCell className="text-center">
                                            <Button variant="ghost" size="icon" onClick={() => toggleExpand(req.id)} className="h-8 w-8">
                                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-semibold">{req.customerDetails.name}</p>
                                            <p className="text-xs text-muted-foreground">{req.customerDetails.mobile}</p>
                                        </TableCell>
                                        <TableCell><Badge variant="secondary" className="capitalize">{req.orderType}</Badge></TableCell>
                                        <TableCell>{formatDate(req.createdAt)}</TableCell>
                                        <TableCell><Badge variant={req.status === 'pending' ? 'default' : 'outline'} className="capitalize">{req.status}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            {req.status === 'pending' && (
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => setRequestToUpdate({ request: req, newStatus: 'approved' })}>
                                                        <ThumbsUp className="h-4 w-4 mr-2" />Approve
                                                    </Button>
                                                     <Button variant="destructive" size="sm" onClick={() => setRequestToUpdate({ request: req, newStatus: 'rejected' })}>
                                                        <ThumbsDown className="h-4 w-4 mr-2" />Reject
                                                    </Button>
                                                </div>
                                            )}
                                            {req.status !== 'pending' && (
                                                <Button variant="outline" size="sm" onClick={() => { setRequestToNote(req); setAdminNote(req.adminNote || ''); }}>
                                                    View/Edit Note
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                    {isExpanded && (
                                         <TableRow>
                                            <TableCell colSpan={6}>
                                                <div className="p-4 bg-muted/50 rounded-md grid md:grid-cols-2 gap-6">
                                                     <div>
                                                        <h4 className="font-semibold mb-2">Requested Materials</h4>
                                                        <div className="space-y-2">
                                                            {req.materials.map((item, index) => (
                                                                <div key={index} className="flex justify-between items-start text-sm p-2 bg-background rounded">
                                                                    <div>
                                                                        <p className="font-medium">{item.materialName}</p>
                                                                        <p className="text-muted-foreground">Qty: {item.quantity}</p>
                                                                        {item.customizationDetails && <p className="text-xs mt-1">Details: {item.customizationDetails}</p>}
                                                                    </div>
                                                                     {item.referenceImage && (
                                                                        <a href={item.referenceImage} target="_blank" rel="noopener noreferrer">
                                                                            <Button variant="ghost" size="sm">Image <ExternalLink className="ml-2 h-3 w-3" /></Button>
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <h4 className="font-semibold mb-2">Customer Details</h4>
                                                            <div className="text-sm space-y-1">
                                                                <p><strong>Company:</strong> {req.customerDetails.companyName || 'N/A'}</p>
                                                                <p><strong>Email:</strong> {req.customerDetails.email || 'N/A'}</p>
                                                                <p><strong>GST:</strong> {req.customerDetails.gstNumber || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold mb-2">Delivery Timeline</h4>
                                                            <p className="text-sm font-semibold">{req.requirementDate}</p>
                                                        </div>
                                                        {req.adminNote && (
                                                             <div>
                                                                <h4 className="font-semibold mb-2">Admin Note</h4>
                                                                <p className="text-sm whitespace-pre-wrap">{req.adminNote}</p>
                                                            </div>
                                                        )}
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
        <div className="space-y-4">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Order Requests</h2>
            </div>

             <Tabs defaultValue="pending">
                <TabsList>
                    <TabsTrigger value="pending">Pending <Badge variant={requests.pending.length > 0 ? "default" : "outline"} className="ml-2">{requests.pending.length}</Badge></TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
                 <TabsContent value="pending" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Requests</CardTitle>
                            <CardDescription>Review and respond to new bulk and customization requests.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <RequestTable requests={requests.pending} emptyMessage="No pending requests." />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="approved" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Approved Requests</CardTitle>
                            <CardDescription>These requests have been approved for processing.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <RequestTable requests={requests.approved} emptyMessage="No approved requests." />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="rejected" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Rejected Requests</CardTitle>
                            <CardDescription>These requests have been rejected.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <RequestTable requests={requests.rejected} emptyMessage="No rejected requests." />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <AlertDialog open={!!requestToUpdate} onOpenChange={(isOpen) => !isOpen && setRequestToUpdate(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Action</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to <span className="font-bold">{requestToUpdate?.newStatus}</span> this request? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setRequestToUpdate(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleUpdateStatus} className={requestToUpdate?.newStatus === 'rejected' ? 'bg-destructive hover:bg-destructive/90' : ''}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <Dialog open={!!requestToNote} onOpenChange={() => setRequestToNote(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Admin Note for {requestToNote?.customerDetails.name}</DialogTitle>
                        <DialogDescription>Add or edit internal notes for this request. This is not visible to the customer.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea 
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            rows={5}
                            placeholder="Add notes about pricing, follow-up actions, etc."
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRequestToNote(null)}>Cancel</Button>
                        <Button onClick={handleSaveNote}>Save Note</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
