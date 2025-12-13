
'use client';

import { Header } from "@/components/shared/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare } from "lucide-react";
import Link from "next/link";

// Replace with your actual WhatsApp number and email
const WHATSAPP_NUMBER = '919876543210'; // Example number, include country code without '+'
const SUPPORT_EMAIL = 'support@purbanchal.com'; // Example email

export default function HelpCenterPage() {
    return (
        <div className="bg-background">
            <Header userData={null} cartItems={[]} updateCartItemQuantity={() => {}} />

            <main className="container mx-auto py-8 sm:py-12 px-4">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Help Center</h1>
                    <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto sm:text-xl">
                        Have a question? We're here to help.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <Card>
                        <CardHeader className="text-center">
                            <div className="mx-auto bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center mb-4">
                                <MessageSquare className="h-8 w-8" />
                            </div>
                            <CardTitle>Contact us on WhatsApp</CardTitle>
                            <CardDescription>Get a quick response for your queries.</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                             <Link href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
                                <Button size="lg">Send Message</Button>
                            </Link>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader className="text-center">
                            <div className="mx-auto bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center mb-4">
                                <Mail className="h-8 w-8" />
                            </div>
                            <CardTitle>Send us an Email</CardTitle>
                            <CardDescription>We'll get back to you as soon as possible.</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                             <Link href={`mailto:${SUPPORT_EMAIL}`}>
                                <Button size="lg">Send Email</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
