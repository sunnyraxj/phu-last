
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, MoreHorizontal, ExternalLink } from 'lucide-react';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { StoreForm } from '@/components/admin/StoreForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type Store = {
    id: string;
    name: string;
    address: string;
    phone?: string;
    image?: string;
    googleMapsLink: string;
};

type StoreFormValues = Omit<Store, 'id'>;

export default function StorePage() {
    const firestore = useFirestore();
    
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);
    const [isEditFormOpen, setIsEditFormOpen] = useState(false);
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);
    const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);

    const storesQuery = useMemoFirebase(() => collection(firestore, 'stores'), [firestore]);
    const { data: stores, isLoading: storesLoading } = useCollection<Store>(storesQuery);

    const handleEditClick = (store: Store) => {
        setSelectedStore(store);
        setIsEditFormOpen(true);
    };

    const handleDeleteStore = async () => {
        if (storeToDelete) {
            const storeRef = doc(firestore, 'stores', storeToDelete.id);
            deleteDocumentNonBlocking(storeRef);
            setStoreToDelete(null);
        }
    };
    
    const handleAddSubmit = (formData: StoreFormValues) => {
        const storesCollection = collection(firestore, "stores");
        addDocumentNonBlocking(storesCollection, formData);
        setIsAddFormOpen(false);
    };

    const handleEditSubmit = (formData: StoreFormValues) => {
        if (selectedStore) {
            const storeRef = doc(firestore, "stores", selectedStore.id);
            setDocumentNonBlocking(storeRef, formData, { merge: true });
        }
        setIsEditFormOpen(false);
    };

    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Our Stores</h2>
                <Dialog open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Store Location
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Store</DialogTitle>
                            <DialogDescription>Fill out the form to add a new store location.</DialogDescription>
                        </DialogHeader>
                        <StoreForm
                            onSuccess={handleAddSubmit}
                            onCancel={() => setIsAddFormOpen(false)}
                            store={null}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Store</DialogTitle>
                        <DialogDescription>Update this store's details.</DialogDescription>
                    </DialogHeader>
                    <StoreForm
                        onSuccess={handleEditSubmit}
                        onCancel={() => setIsEditFormOpen(false)}
                        store={selectedStore}
                    />
                </DialogContent>
            </Dialog>
            
            <Card>
                <CardHeader>
                    <CardTitle>All Store Locations</CardTitle>
                    <CardDescription>Manage your physical store locations.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>Map Link</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {storesLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <PottersWheelSpinner />
                                        </TableCell>
                                    </TableRow>
                                ) : stores && stores.length > 0 ? (
                                    stores.map((store) => (
                                        <TableRow key={store.id}>
                                            <TableCell className="font-medium">{store.name}</TableCell>
                                            <TableCell>{store.address}</TableCell>
                                            <TableCell>
                                                <Link href={store.googleMapsLink} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="ghost" size="sm">
                                                        View on Map <ExternalLink className="ml-2 h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEditClick(store)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => setStoreToDelete(store)}>
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No stores found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={!!storeToDelete} onOpenChange={(isOpen) => !isOpen && setStoreToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the store location
                            from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setStoreToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteStore} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
