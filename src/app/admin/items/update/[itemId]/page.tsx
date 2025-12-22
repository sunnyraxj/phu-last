
'use client';

import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { ItemForm, type ItemFormValues } from '@/components/admin/ItemForm';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Item = ItemFormValues & { id?: string };

export default function UpdateItemPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    const { itemId } = useParams();

    const itemRef = useMemoFirebase(() => doc(firestore, 'products', itemId as string), [firestore, itemId]);
    const { data: item, isLoading: itemLoading } = useDoc<Item>(itemRef);
    
    const handleFormSubmit = (formData: ItemFormValues) => {
        setDocumentNonBlocking(itemRef, formData, { merge: true });
        toast({
            title: 'Item Updated',
            description: `${formData.name} has been successfully updated.`,
        });
        router.push('/admin/items');
    };
    
    const handleCancel = () => {
        router.push('/admin/items');
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                 <Link href="/admin/items">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h2 className="text-3xl font-bold tracking-tight">Update Item</h2>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Edit Item Details</CardTitle>
                    <CardDescription>
                        Modify the details for the item below. Click "Save Changes" when you're done.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {itemLoading ? (
                        <div className="h-96 flex items-center justify-center">
                            <PottersWheelSpinner />
                        </div>
                    ) : item ? (
                        <ItemForm
                            item={item}
                            onSuccess={handleFormSubmit}
                            onCancel={handleCancel}
                        />
                    ) : (
                        <p>Item not found.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

