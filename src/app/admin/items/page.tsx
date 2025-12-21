

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

type Item = ItemFormValues & {
    id: string;
};

export default function ItemsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [itemsToDelete, setItemsToDelete] = useState<Item[]>([]);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

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

    const handleDeleteItems = async () => {
        if (itemsToDelete.length > 0) {
            const batch = writeBatch(firestore);
            itemsToDelete.forEach(item => {
                const itemRef = doc(firestore, 'products', item.id);
                batch.delete(itemRef);
            });
            await batch.commit();
            setItemsToDelete([]);
            setSelectedItems([]);
            toast({
                title: `${itemsToDelete.length} item(s) deleted.`,
            });
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

    const toggleSelection = (itemId: string) => {
        setSelectedItems(prev => 
            prev.includes(itemId) 
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const toggleSelectAll = () => {
        if (items && selectedItems.length === items.length) {
            setSelectedItems([]);
        } else if (items) {
            setSelectedItems(items.map(item => item.id));
        }
    };
    
    const confirmDelete = () => {
        const toDelete = items?.filter(item => selectedItems.includes(item.id)) || [];
        setItemsToDelete(toDelete);
    }

    return (
        <div className="flex-1 space-y-4">
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
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>All Items</CardTitle>
                        <CardDescription>Manage the items available in your store.</CardDescription>
                    </div>
                     {selectedItems.length > 0 && (
                        <Button variant="destructive" onClick={confirmDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete ({selectedItems.length})
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={items ? selectedItems.length === items.length && items.length > 0 : false}
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </TableHead>
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
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <PottersWheelSpinner />
                                        </TableCell>
                                    </TableRow>
                                ) : items && items.length > 0 ? (
                                    items.map((item) => (
                                        <TableRow key={item.id} data-state={selectedItems.includes(item.id) && "selected"}>
                                            <TableCell>
                                                 <Checkbox
                                                    checked={selectedItems.includes(item.id)}
                                                    onCheckedChange={() => toggleSelection(item.id)}
                                                />
                                            </TableCell>
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
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            No items found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={itemsToDelete.length > 0} onOpenChange={(isOpen) => !isOpen && setItemsToDelete([])}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete {itemsToDelete.length} item(s)
                            from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setItemsToDelete([])}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteItems} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
