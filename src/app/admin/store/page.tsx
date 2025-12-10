'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function StorePage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Our Store</h2>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Store Management</CardTitle>
                    <CardDescription>
                        This section is under construction.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Functionality to manage your store details will be available here soon.</p>
                </CardContent>
            </Card>
        </div>
    );
}
