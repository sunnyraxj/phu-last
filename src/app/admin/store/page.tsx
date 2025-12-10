'use client';

import { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import Image from 'next/image';

const storeDetailsSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  address: z.string().min(1, 'Store address is required'),
  phone: z.string().optional(),
  about: z.string().optional(),
  image: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

type StoreDetailsFormValues = z.infer<typeof storeDetailsSchema>;

export default function StorePage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const storeDetailsRef = useMemoFirebase(() => doc(firestore, 'storeDetails', 'main'), [firestore]);
    const { data: storeDetails, isLoading: storeDetailsLoading } = useDoc<StoreDetailsFormValues>(storeDetailsRef);
    
    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<StoreDetailsFormValues>({
        resolver: zodResolver(storeDetailsSchema),
        defaultValues: { name: '', address: '', image: '' },
    });

    const imageUrl = watch('image');

    useEffect(() => {
        if (storeDetails) {
            reset(storeDetails);
        }
    }, [storeDetails, reset]);

    const onSubmit: SubmitHandler<StoreDetailsFormValues> = (data) => {
        setDocumentNonBlocking(storeDetailsRef, data, { merge: true });
        toast({
            title: 'Store Details Updated',
            description: 'Your store information has been saved successfully.',
        });
    };

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Our Store</h2>
            </div>
            <Card>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardHeader>
                        <CardTitle>Store Management</CardTitle>
                        <CardDescription>
                            Update your store's public information here.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {storeDetailsLoading ? (
                           <div className="flex justify-center items-center h-48">
                                <PottersWheelSpinner />
                           </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="name">Store Name</Label>
                                        <Input id="name" {...register('name')} />
                                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="address">Address</Label>
                                        <Input id="address" {...register('address')} />
                                        {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input id="phone" {...register('phone')} />
                                        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="image">Store Image URL</Label>
                                        <Input id="image" {...register('image')} placeholder="https://picsum.photos/seed/..."/>
                                        {errors.image && <p className="text-sm text-destructive">{errors.image.message}</p>}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="about">About the Store</Label>
                                        <Textarea id="about" {...register('about')} rows={8} />
                                        {errors.about && <p className="text-sm text-destructive">{errors.about.message}</p>}
                                    </div>
                                     {imageUrl && (
                                        <div className="space-y-2">
                                            <Label>Image Preview</Label>
                                            <div className="relative aspect-video w-full overflow-hidden rounded-md border">
                                                <Image src={imageUrl} alt="Store Preview" fill className="object-cover" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button type="submit" disabled={isSubmitting || storeDetailsLoading}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
