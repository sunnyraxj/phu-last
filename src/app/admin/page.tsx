
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { ProductForm, type ProductFormValues } from '@/components/admin/ProductForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type Product = {
    id: string;
    name: string;
    mrp: number;
    category: string;
    inStock: boolean;
    description: string;
    material: string;
    image: string;
    hsn?: string;
    gst?: number;
    size?: {
        height?: number;
        length?: number;
        width?: number;
    };
    'data-ai-hint'?: string;
};

export default function AdminProductsPage() {
    const firestore = useFirestore();
    
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);
    const [isEditFormOpen, setIsEditFormOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);

    const productsQuery = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
    const { data: products, isLoading: productsLoading } = useCollection<Product>(productsQuery);

    const [materials, setMaterials] = useState<string[]>([]);
    const [categories, setCategories] = useState<string[]>([]);

    useMemo(() => {
        if (products) {
            setMaterials(prev => [...new Set([...prev, ...products.map(p => p.material).filter(Boolean)])]);
            setCategories(prev => [...new Set([...prev, ...products.map(p => p.category).filter(Boolean)])]);
        }
    }, [products]);

    const handleNewCategory = useCallback((category: string) => {
        setCategories(prev => [...new Set([...prev, category])]);
    }, []);

    const handleNewMaterial = useCallback((material: string) => {
        setMaterials(prev => [...new Set([...prev, material])]);
    }, []);
    
    const handleCloseDialog = useCallback(() => {
        setIsAddFormOpen(false);
        setIsEditFormOpen(false);
        setSelectedProduct(null);
    }, []);

    const handleEditClick = (product: Product) => {
        setSelectedProduct(product);
        setIsEditFormOpen(true);
    };

    const handleDeleteProduct = async () => {
        if (productToDelete) {
            const productRef = doc(firestore, 'products', productToDelete.id);
            deleteDocumentNonBlocking(productRef);
            setProductToDelete(null);
        }
    };
    
    const handleAddSubmit = (formData: ProductFormValues) => {
        const dataWithGST = { ...formData, gst: formData.gst || 5 };
        const productsCollection = collection(firestore, "products");
        addDocumentNonBlocking(productsCollection, dataWithGST);
        setIsAddFormOpen(false);
    };

    const handleEditSubmit = (formData: ProductFormValues) => {
        if (selectedProduct) {
            const productRef = doc(firestore, "products", selectedProduct.id);
            const dataWithGST = { ...formData, gst: formData.gst || 5 };
            setDocumentNonBlocking(productRef, dataWithGST, { merge: true });
        }
        setIsEditFormOpen(false);
        setSelectedProduct(null);
    };

    return (
        <div className="flex-1 space-y-4 p-2 sm:p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                 <h2 className="text-3xl font-bold tracking-tight">Products</h2>
                <Dialog open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Product
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Add New Product</DialogTitle>
                            <DialogDescription>
                                Fill out the form to add a new product to the store.
                            </DialogDescription>
                        </DialogHeader>
                        <ProductForm 
                            onSuccess={handleAddSubmit}
                            onClose={handleCloseDialog}
                            product={null}
                            existingMaterials={materials}
                            existingCategories={categories}
                            onNewCategory={handleNewCategory}
                            onNewMaterial={handleNewMaterial}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                        <DialogDescription>
                           Update the details of this product.
                        </DialogDescription>
                    </DialogHeader>
                     <ProductForm 
                        onSuccess={handleEditSubmit}
                        onClose={handleCloseDialog}
                        product={selectedProduct}
                        existingMaterials={materials}
                        existingCategories={categories}
                        onNewCategory={handleNewCategory}
                        onNewMaterial={handleNewMaterial}
                    />
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader>
                    <CardTitle>All Products</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="hidden md:table-cell">MRP</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {productsLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <PottersWheelSpinner />
                                        </TableCell>
                                    </TableRow>
                                ) : products && products.length > 0 ? (
                                    products.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell>{product.category}</TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(product.mrp)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={product.inStock ? 'default' : 'destructive'}>
                                                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEditClick(product)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive" onClick={() => setProductToDelete(product)}>
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
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No products found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Single Delete Alert */}
            <AlertDialog open={!!productToDelete} onOpenChange={(isOpen) => !isOpen && setProductToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the product
                        from the database.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setProductToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
