
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, MoreHorizontal, ChevronDown, FilePenLine } from 'lucide-react';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { ProductForm } from '@/components/admin/ProductForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { BulkEditForm, type BulkEditFormValues } from '@/components/admin/BulkEditForm';

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
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isBulkEditFormOpen, setIsBulkEditFormOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false);
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

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
            setSelectedProductIds(prev => prev.filter(id => id !== productToDelete.id));
        }
    };

    const handleBulkDelete = () => {
        if (!firestore) return;
        const batch = writeBatch(firestore);
        selectedProductIds.forEach(id => {
            const productRef = doc(firestore, 'products', id);
            batch.delete(productRef);
        });
        batch.commit().then(() => {
            setSelectedProductIds([]);
            setIsBulkDeleteAlertOpen(false);
        });
    };
    
    const handleFormSubmit = (formData: Omit<Product, 'id'>) => {
        const dataWithGST = { ...formData, gst: formData.gst || 5 };
        if (selectedProduct) {
            // Update existing product
            const productRef = doc(firestore, "products", selectedProduct.id);
            setDocumentNonBlocking(productRef, dataWithGST, { merge: true });
        } else {
            // Add new product
            const productsCollection = collection(firestore, "products");
            addDocumentNonBlocking(productsCollection, dataWithGST);
        }
        setIsFormOpen(false);
        setSelectedProduct(null);
    };

    const handleBulkEditSubmit = (formData: BulkEditFormValues) => {
        if (!firestore || selectedProductIds.length === 0) return;

        const batch = writeBatch(firestore);
        const updates: Partial<Product> = {};

        // Build the update object only with the fields that were actually changed
        if (formData.category) updates.category = formData.category;
        if (formData.material) updates.material = formData.material;
        if (formData.mrp !== undefined && !isNaN(formData.mrp)) updates.mrp = formData.mrp;
        if (formData.inStock !== undefined) updates.inStock = formData.inStock;
        if (formData.gst !== undefined && !isNaN(formData.gst)) updates.gst = formData.gst;

        if (Object.keys(updates).length > 0) {
             selectedProductIds.forEach(id => {
                const productRef = doc(firestore, 'products', id);
                batch.update(productRef, updates);
            });
            batch.commit().then(() => {
                setIsBulkEditFormOpen(false);
                setSelectedProductIds([]);
            });
        } else {
            setIsBulkEditFormOpen(false);
        }
    };


    const handleSelectAll = (checked: boolean) => {
        if (checked && products) {
            setSelectedProductIds(products.map(p => p.id));
        } else {
            setSelectedProductIds([]);
        }
    };

    const handleSelectProduct = (productId: string, checked: boolean) => {
        if (checked) {
            setSelectedProductIds(prev => [...prev, productId]);
        } else {
            setSelectedProductIds(prev => prev.filter(id => id !== productId));
        }
    };

    const numSelected = selectedProductIds.length;
    const allProductsCount = products?.length || 0;

    return (
        <div className="flex-1 space-y-4 p-2 sm:p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div className="flex items-center gap-4">
                    {numSelected > 0 ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    Actions ({numSelected})
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                 <DropdownMenuItem onClick={() => setIsBulkEditFormOpen(true)}>
                                    <FilePenLine className="mr-2 h-4 w-4" />
                                    Bulk Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    className="text-destructive" 
                                    onClick={() => setIsBulkDeleteAlertOpen(true)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Selected
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                         <h2 className="text-3xl font-bold tracking-tight">Products</h2>
                    )}
                </div>

                <Button onClick={handleAddProduct}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Product
                </Button>
            </div>

            <ProductForm 
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleFormSubmit}
                product={selectedProduct}
                existingMaterials={materials}
                existingCategories={categories}
                onNewCategory={handleNewCategory}
                onNewMaterial={handleNewMaterial}
            />

            <BulkEditForm
                isOpen={isBulkEditFormOpen}
                onClose={() => setIsBulkEditFormOpen(false)}
                onSubmit={handleBulkEditSubmit}
                existingCategories={categories}
                existingMaterials={materials}
                onNewCategory={handleNewCategory}
                onNewMaterial={handleNewMaterial}
                selectedCount={numSelected}
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
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={numSelected > 0 && numSelected === allProductsCount}
                                            onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                                            aria-label="Select all"
                                        />
                                    </TableHead>
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
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <PottersWheelSpinner />
                                        </TableCell>
                                    </TableRow>
                                ) : products && products.length > 0 ? (
                                    products.map((product) => (
                                        <TableRow key={product.id} data-state={selectedProductIds.includes(product.id) && "selected"}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedProductIds.includes(product.id)}
                                                    onCheckedChange={(checked) => handleSelectProduct(product.id, Boolean(checked))}
                                                    aria-label={`Select ${product.name}`}
                                                />
                                            </TableCell>
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
                                                        <DropdownMenuItem onClick={() => handleEditProduct(product)}>
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
                                        <TableCell colSpan={6} className="h-24 text-center">
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

            {/* Bulk Delete Alert */}
            <AlertDialog open={isBulkDeleteAlertOpen} onOpenChange={setIsBulkDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the {numSelected} selected products from the database.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">Delete Products</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

    
