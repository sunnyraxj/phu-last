
'use client';

import { useState, useMemo, useRef } from 'react';
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { Edit, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

type Product = {
    material: string;
};

type MaterialSetting = {
    id: string;
    name: string;
    imageUrl: string;
};

export default function MaterialsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const inputFileRef = useRef<HTMLInputElement>(null);

    const [isEditFormOpen, setIsEditFormOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<MaterialSetting | { name: string; imageUrl: string } | null>(null);

    const productsQuery = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
    const { data: products, isLoading: productsLoading } = useCollection<Product>(productsQuery);

    const materialSettingsQuery = useMemoFirebase(() => collection(firestore, 'materialSettings'), [firestore]);
    const { data: materialSettings, isLoading: settingsLoading } = useCollection<MaterialSetting>(materialSettingsQuery);

    const uniqueMaterials = useMemo(() => {
        if (!products) return [];
        const materialSet = new Set(products.map(p => p.material).filter(Boolean));
        return Array.from(materialSet);
    }, [products]);

    const materialsWithSettings = useMemo(() => {
        const settingsMap = new Map(materialSettings?.map(s => [s.name, s]));
        return uniqueMaterials.map(name => {
            const setting = settingsMap.get(name);
            return {
                id: setting?.id || name,
                name: name,
                imageUrl: setting?.imageUrl || '',
            };
        });
    }, [uniqueMaterials, materialSettings]);

    const handleEditClick = (material: MaterialSetting) => {
        setSelectedMaterial(material);
        setIsEditFormOpen(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMaterial) return;
        
        const { name, imageUrl } = selectedMaterial;
        const materialRef = doc(firestore, 'materialSettings', name);

        try {
            await setDocumentNonBlocking(materialRef, { name, imageUrl }, { merge: true });
            toast({
                title: 'Material Updated',
                description: `The image for ${name} has been updated.`,
            });
            setIsEditFormOpen(false);
            setSelectedMaterial(null);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not update the material image.',
            });
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !selectedMaterial) return;

        setIsUploading(true);
        try {
            const response = await fetch(`/api/upload?filename=${file.name}`, {
                method: 'POST',
                body: file,
            });

            const newBlob = await response.json();
            if (newBlob.url) {
                setSelectedMaterial(prev => prev ? { ...prev, imageUrl: newBlob.url } : null);
                toast({ title: 'Image uploaded successfully!' });
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Upload failed',
                description: 'Could not upload the image. Please try again.',
            });
        } finally {
            setIsUploading(false);
            if (inputFileRef.current) {
                inputFileRef.current.value = '';
            }
        }
    };
    
    const isLoading = productsLoading || settingsLoading;

    return (
        <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Material Settings</h2>

            <Card>
                <CardHeader>
                    <CardTitle>Material Images</CardTitle>
                    <CardDescription>
                        Manage the images displayed for each material on the homepage.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Material Name</TableHead>
                                    <TableHead>Image Preview</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            <PottersWheelSpinner />
                                        </TableCell>
                                    </TableRow>
                                ) : materialsWithSettings.length > 0 ? (
                                    materialsWithSettings.map((material) => (
                                        <TableRow key={material.name}>
                                            <TableCell className="font-medium">{material.name}</TableCell>
                                            <TableCell>
                                                {material.imageUrl ? (
                                                    <div className="relative h-12 w-24 rounded-md overflow-hidden bg-muted">
                                                        <Image src={material.imageUrl} alt={material.name} fill className="object-cover" />
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">No image set</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => handleEditClick(material)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit Image
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            No materials found in products.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Image for: {selectedMaterial?.name}</DialogTitle>
                        <DialogDescription>
                            Upload an image from your device or paste an image URL.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleFormSubmit}>
                        <div className="py-4 space-y-4">
                            <div>
                                <Input
                                    type="file"
                                    ref={inputFileRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="file-upload"
                                    accept="image/*"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => inputFileRef.current?.click()}
                                    disabled={isUploading}
                                    className="w-full"
                                >
                                    {isUploading ? <PottersWheelSpinner /> : <><UploadCloud className="mr-2 h-4 w-4" /> Upload from Device</>}
                                </Button>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or
                                </span>
                                </div>
                            </div>
                             <div>
                                <Label htmlFor="imageUrl">Image URL</Label>
                                <Input
                                    id="imageUrl"
                                    value={selectedMaterial?.imageUrl || ''}
                                    onChange={(e) => setSelectedMaterial(prev => prev ? { ...prev, imageUrl: e.target.value } : null)}
                                    placeholder="https://example.com/image.jpg"
                                />
                             </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button type="button" variant="outline" onClick={() => setIsEditFormOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isUploading}>Save</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
