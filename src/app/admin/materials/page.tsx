
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, useDoc } from '@/firebase';
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

type SiteSettings = {
    heroImageUrl?: string;
    heroImageUrlMobile?: string;
}

export default function MaterialsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const inputFileRef = useRef<HTMLInputElement>(null);
    const heroDesktopInputRef = useRef<HTMLInputElement>(null);
    const heroMobileInputRef = useRef<HTMLInputElement>(null);

    const [isEditFormOpen, setIsEditFormOpen] = useState(false);
    const [isHeroEditFormOpen, setIsHeroEditFormOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<MaterialSetting | { name: string; imageUrl: string } | null>(null);
    const [heroImage, setHeroImage] = useState<{ url: string | undefined, urlMobile: string | undefined }>({ url: '', urlMobile: '' });


    const productsQuery = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
    const { data: products, isLoading: productsLoading } = useCollection<Product>(productsQuery);

    const materialSettingsQuery = useMemoFirebase(() => collection(firestore, 'materialSettings'), [firestore]);
    const { data: materialSettings, isLoading: settingsLoading } = useCollection<MaterialSetting>(materialSettingsQuery);
    
    const siteSettingsRef = useMemoFirebase(() => doc(firestore, 'siteSettings', 'homepage'), [firestore]);
    const { data: siteSettings, isLoading: siteSettingsLoading } = useDoc<SiteSettings>(siteSettingsRef);

    useEffect(() => {
        if (siteSettings) {
            setHeroImage({ url: siteSettings.heroImageUrl, urlMobile: siteSettings.heroImageUrlMobile });
        }
    }, [siteSettings]);

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
    
    const handleHeroFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!heroImage.url && !heroImage.urlMobile) return;
        
        const settingsRef = doc(firestore, 'siteSettings', 'homepage');

        try {
            await setDocumentNonBlocking(settingsRef, { 
                heroImageUrl: heroImage.url,
                heroImageUrlMobile: heroImage.urlMobile || heroImage.url,
            }, { merge: true });
            toast({
                title: 'Hero Image Updated',
                description: `The homepage hero image has been updated.`,
            });
            setIsHeroEditFormOpen(false);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not update the hero image.',
            });
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, target: 'material' | 'hero' | 'heroMobile' = 'material') => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const response = await fetch(`/api/upload?filename=${file.name}`, {
                method: 'POST',
                body: file,
            });

            const newBlob = await response.json();
            if (newBlob.url) {
                if (target === 'material' && selectedMaterial) {
                    setSelectedMaterial(prev => prev ? { ...prev, imageUrl: newBlob.url } : null);
                } else if (target === 'hero') {
                    setHeroImage(prev => ({...prev, url: newBlob.url}));
                } else if (target === 'heroMobile') {
                    setHeroImage(prev => ({...prev, urlMobile: newBlob.url}));
                }
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
            if (event.target) {
                event.target.value = '';
            }
        }
    };
    
    const isLoading = productsLoading || settingsLoading || siteSettingsLoading;

    return (
        <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Content Settings</h2>

            <Card>
                <CardHeader>
                    <CardTitle>Hero Image</CardTitle>
                    <CardDescription>
                        Manage the main image displayed on the homepage.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {siteSettingsLoading ? (
                         <div className="flex items-center justify-center h-24"><PottersWheelSpinner /></div>
                     ) : (
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                           <div className="w-full sm:w-1/2">
                             <Label>Desktop Hero Image</Label>
                             <div className="relative h-40 w-full rounded-md overflow-hidden bg-muted mt-2">
                                {heroImage.url ? (
                                    <Image src={heroImage.url} alt="Hero Image" fill className="object-cover" />
                                ) : <div className="h-full w-full bg-muted flex items-center justify-center text-xs text-muted-foreground">Not set</div>}
                             </div>
                           </div>
                           <div className="w-full sm:w-1/2">
                             <Label>Mobile Hero Image (Optional)</Label>
                             <div className="relative h-40 w-full rounded-md overflow-hidden bg-muted mt-2">
                                {heroImage.urlMobile ? (
                                    <Image src={heroImage.urlMobile} alt="Mobile Hero Image" fill className="object-cover" />
                                ) : <div className="h-full w-full bg-muted flex items-center justify-center text-xs text-muted-foreground">Uses desktop image if not set</div>}
                             </div>
                           </div>
                        </div>
                     )}
                </CardContent>
                 <CardContent>
                    <Button variant="outline" onClick={() => setIsHeroEditFormOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Hero Image
                    </Button>
                 </CardContent>
            </Card>

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
                                    onChange={(e) => handleFileUpload(e, 'material')}
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
            
            <Dialog open={isHeroEditFormOpen} onOpenChange={setIsHeroEditFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Homepage Hero Image</DialogTitle>
                        <DialogDescription>
                            Set the main image for your homepage. You can set different images for desktop and mobile.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleHeroFormSubmit}>
                        <div className="py-4 space-y-6">
                            <div className="space-y-2">
                                <Label>Desktop Image</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={heroImage.url || ''}
                                        onChange={(e) => setHeroImage(prev => ({...prev, url: e.target.value}))}
                                        placeholder="Paste image URL here"
                                    />
                                     <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => heroDesktopInputRef.current?.click()}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? <PottersWheelSpinner /> : <UploadCloud className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label>Mobile Image (Optional)</Label>
                                 <p className="text-xs text-muted-foreground">If left blank, the desktop image will be used on mobile.</p>
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={heroImage.urlMobile || ''}
                                        onChange={(e) => setHeroImage(prev => ({...prev, urlMobile: e.target.value}))}
                                        placeholder="Paste image URL here"
                                    />
                                     <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => heroMobileInputRef.current?.click()}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? <PottersWheelSpinner /> : <UploadCloud className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <Input
                                type="file"
                                ref={heroDesktopInputRef}
                                onChange={(e) => handleFileUpload(e, 'hero')}
                                className="hidden"
                                id="hero-desktop-file-upload"
                                accept="image/*"
                            />
                            <Input
                                type="file"
                                ref={heroMobileInputRef}
                                onChange={(e) => handleFileUpload(e, 'heroMobile')}
                                className="hidden"
                                id="hero-mobile-file-upload"
                                accept="image/*"
                            />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button type="button" variant="outline" onClick={() => setIsHeroEditFormOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isUploading}>Save</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
