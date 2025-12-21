

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ItemForm, type ItemFormValues } from '@/components/admin/ItemForm';
import Image from 'next/image';

type Item = ItemFormValues & {
    id: string;
};

export default function ItemsPage() {
    const firestore = useFirestore();
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

    const itemsQuery = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
    const { data: items, isLoading: itemsLoading } = useCollection<Item>(itemsQuery);

    const handleEditClick = (item: Item) => {
        setSelectedItem(item);
        setIsFormOpen(true);
    };

    const handleAddNewClick = () => {
        setSelectedItem(null);
        setIsFormOpen(true);
    };
    
    const handleCloseForm = useCallback(() => {
        setIsFormOpen(false);
        setSelectedItem(null);
    }, []);

    const handleDeleteItem = () => {
        if (itemToDelete) {
            const itemRef = doc(firestore, 'products', itemToDelete.id);
            deleteDocumentNonBlocking(itemRef);
            setItemToDelete(null);
        }
    };
    
    const handleFormSubmit = (formData: ItemFormValues) => {
        if (selectedItem) {
            // Editing existing item
            const itemRef = doc(firestore, "products", selectedItem.id);
            setDocumentNonBlocking(itemRef, formData, { merge: true });
        } else {
            // Adding new item
            const itemsCollection = collection(firestore, "products");
            addDocumentNonBlocking(itemsCollection, formData);
        }
        handleCloseForm();
    };

    return (
        <div className="flex-1 space-y-4 p-2 sm:p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Items</h2>
                 <Dialog open={isFormOpen} onOpenChange={(open) => !open && handleCloseForm()}>
                    <DialogTrigger asChild>
                         <Button onClick={handleAddNewClick}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add New
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>{selectedItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
                            <DialogDescription>
                                {selectedItem ? "Update the details for this item." : "Fill out the form to add a new item to your store."}
                            </DialogDescription>
                        </DialogHeader>
                        <ItemForm
                            product={selectedItem}
                            onSuccess={handleFormSubmit}
                            onCancel={handleCloseForm}
                        />
                    </DialogContent>
                </Dialog>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>All Items</CardTitle>
                    <CardDescription>Manage the items available in your store.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Image</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {itemsLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <PottersWheelSpinner />
                                        </TableCell>
                                    </TableRow>
                                ) : items && items.length > 0 ? (
                                    items.map((item) => (
                                        <TableRow key={item.id}>
                                             <TableCell>
                                                <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted">
                                                    {item.images?.[0] ? (
                                                        <Image src={item.images[0]} alt={item.name} fill className="object-cover"/>
                                                    ) : <div className="h-full w-full bg-muted"></div> }
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>{item.category}</TableCell>
                                            <TableCell>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.mrp)}</TableCell>
                                            <TableCell>
                                                <Badge variant={item.inStock ? 'outline' : 'destructive'}>
                                                    {item.inStock ? 'In Stock' : 'Out of Stock'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(item)}>
                                                        <Edit className="h-4 w-4" />
                                                        <span className="sr-only">Edit</span>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setItemToDelete(item)}>
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">Delete</span>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No items found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={!!itemToDelete} onOpenChange={(isOpen) => !isOpen && setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the item
                            from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
