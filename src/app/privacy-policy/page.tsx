
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, Truck, Undo2, Lock, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
    return (
        <div className="bg-background">
            <div className="container mx-auto px-4 pt-8">
                <Link href="/">
                    <Button variant="outline">
                        <Home className="mr-2 h-4 w-4" /> Home
                    </Button>
                </Link>
            </div>

            <main className="container mx-auto pb-8 sm:pb-12 px-4">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Privacy Policy</h1>
                    <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto sm:text-xl">
                        Your trust is important to us. Here’s how we handle your data, shipping, and returns.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
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
                                We are committed to getting your order to you quickly. We aim to deliver all orders within **7 business days** from the date of order confirmation. You will receive tracking information and delivery estimates once your order has shipped.
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
                                Returns are accepted only for products that are **damaged or defective** upon arrival. To be eligible for a return, you must initiate a request within **3 days of the delivery date**. To start the process, you must provide clear photographs of the damaged item for verification through the return request form on your order history page.
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
                                We stand by the quality of our products. If your item is confirmed as damaged upon arrival, you are eligible for our **3-day money-back guarantee**. This is applicable from the date you receive your product and a successful return request is approved. Please note conditions apply based on the product's state upon return.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Lock className="h-8 w-8 text-primary" />
                             <div>
                                <CardTitle>Your Data Privacy</CardTitle>
                                <CardDescription>Secure and protected.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                We collect essential user information (name, email, shipping address) solely for the purpose of processing your orders and managing your account. We use secure Firebase Authentication and do not share your personal data with third parties. All payment information is handled securely through our UPI payment gateway.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
