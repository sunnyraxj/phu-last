'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { ProductForm } from '@/components/admin/ProductForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

type Product = {
    id: string;
    name: string;
    price: number;
    category: string;
    inStock: boolean;
    description: string;
    material: string;
    collection: string;
    image: string;
    'data-ai-hint'?: string;
};

export default function AdminProductsPage() {
    const firestore = useFirestore();
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);

    const productsQuery = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
    const { data: products, isLoading: productsLoading } = useCollection<Product>(productsQuery);

    const existingMaterials = useMemo(() => {
        if (!products) return [];
        return [...new Set(products.map(p => p.material).filter(Boolean))];
    }, [products]);

    const existingCollections = useMemo(() => {
        if (!products) return [];
        return [...new Set(products.map(p => p.collection).filter(Boolean))];
    }, [products]);

    const handleAddProduct = () => {
        setSelectedProduct(null);
        setIsFormOpen(true);
    };

    const handleEditProduct = (product: Product) => {
        setSelectedProduct(product);
        setIsFormOpen(true);
    };

    const handleDeleteProduct = async () => {
        if (productToDelete) {
            const productRef = doc(firestore, 'products', productToDelete.id);
            deleteDocumentNonBlocking(productRef);
            setProductToDelete(null);
        }
    };
    
    const handleFormSubmit = (formData: Omit<Product, 'id'>) => {
        if (selectedProduct) {
            // Update existing product
            const productRef = doc(firestore, "products", selectedProduct.id);
            setDocumentNonBlocking(productRef, formData, { merge: true });
        } else {
            // Add new product
            const productsCollection = collection(firestore, "products");
            addDocumentNonBlocking(productsCollection, formData);
        }
        setIsFormOpen(false);
        setSelectedProduct(null);
    };

    return (
        <div className="flex-1 space-y-4 p-2 sm:p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Products</h2>
                <Button onClick={handleAddProduct}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Product
                </Button>
            </div>

            <ProductForm 
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleFormSubmit}
                product={selectedProduct}
                existingMaterials={existingMaterials}
                existingCollections={existingCollections}
            />
            
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
                                    <TableHead className="hidden md:table-cell">Price</TableHead>
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
                                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(product.price)}
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
                                                        <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
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
