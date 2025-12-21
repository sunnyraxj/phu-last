
'use client';

import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { SettingsForm, type CompanySettingsFormValues } from '@/components/admin/SettingsForm';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

type CompanySettings = CompanySettingsFormValues & { id?: string };

export default function SettingsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const settingsRef = useMemoFirebase(() => doc(firestore, 'companySettings', 'main'), [firestore]);
    const { data: settings, isLoading: settingsLoading } = useDoc<CompanySettings>(settingsRef);
    
    const handleFormSubmit = (formData: CompanySettingsFormValues) => {
        setDocumentNonBlocking(settingsRef, formData, { merge: true });
        toast({
            title: 'Settings Saved',
            description: 'Your company settings have been updated.',
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Company Settings</h2>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Invoice & Company Details</CardTitle>
                    <CardDescription>
                        Manage your company information for invoices and branding.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {settingsLoading ? (
                        <div className="h-96 flex items-center justify-center">
                            <PottersWheelSpinner />
                        </div>
                    ) : (
                        <SettingsForm
                            settings={settings}
                            onSubmit={handleFormSubmit}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
