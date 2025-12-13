
'use client';

import { Header } from "@/components/shared/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, Truck, Undo2 } from "lucide-react";

export default function PrivacyPolicyPage() {
    return (
        <div className="bg-background">
            <Header userData={null} cartItems={[]} updateCartItemQuantity={() => {}} />

            <main className="container mx-auto py-8 sm:py-12 px-4">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Privacy & Policies</h1>
                    <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto sm:text-xl">
                        Your trust is important to us. Here’s how we handle shipping, returns, and your data.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Truck className="h-8 w-8 text-primary" />
                            <div>
                                <CardTitle>Shipping & Delivery</CardTitle>
                                <CardDescription>Fast and reliable.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                We are committed to getting your order to you quickly. We aim to deliver all orders within **3 business days** from the date of order confirmation. You will receive tracking information once your order has shipped.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <ShieldCheck className="h-8 w-8 text-primary" />
                             <div>
                                <CardTitle>Money-Back Guarantee</CardTitle>
                                <CardDescription>Shop with confidence.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <p className="text-muted-foreground">
                                We stand by the quality of our products. If you are not satisfied with your purchase, you are eligible for our **3-day money-back guarantee**. This is applicable from the date you receive your product. Please note conditions may apply based on the product's state upon return.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Undo2 className="h-8 w-8 text-primary" />
                             <div>
                                <CardTitle>Return & Refund Policy</CardTitle>
                                <CardDescription>For damaged goods.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Returns are accepted only for products that are **damaged or defective** upon arrival. To initiate a return, you must provide a clear photograph of the damaged item for verification. Please contact our support team within 3 days of receiving your order to start the process.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
