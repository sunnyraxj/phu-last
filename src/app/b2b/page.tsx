
'use client';

import { Header } from "@/components/shared/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Users, Palette, MessageSquare } from "lucide-react";
import Link from "next/link";

const B2B_WHATSAPP_NUMBER = '918638098776'; 
const B2B_SUPPORT_EMAIL = 'purbanchalhastaudyog@gmail.com'; 

export default function B2BPage() {

    const features = [
        {
            icon: Palette,
            title: "Custom Designs & White Labeling",
            description: "Collaborate with our artisans to create unique products tailored to your brand's vision. We offer white labeling to make our crafts truly yours."
        },
        {
            icon: Users,
            title: "Corporate Gifting",
            description: "Make a lasting impression with authentic, handcrafted gifts that tell a story of tradition and sustainability."
        },
        {
            icon: CheckCircle,
            title: "Bulk & Wholesale Pricing",
            description: "Get competitive pricing on bulk orders for your retail store, events, or corporate needs. We scale with you."
        }
    ];

    const whatsappMessage = encodeURIComponent("Hello, I'm interested in a B2B partnership and would like to discuss custom or bulk orders.");

    return (
        <div className="bg-background">
            <Header />

            <section className="bg-primary text-primary-foreground py-20">
                <div className="container mx-auto text-center px-4">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Partner with Us</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto">
                        Elevate your business with authentic, handcrafted products from the heart of Northeast India.
                    </p>
                </div>
            </section>
            
            <main className="container mx-auto py-12 sm:py-16 px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Why Purbanchal Hasta Udyog?</h2>
                    <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto sm:text-lg">
                        We offer more than just products; we offer a partnership rooted in authenticity, craftsmanship, and social responsibility.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
                    {features.map((feature, index) => (
                        <Card key={index} className="text-center">
                             <CardHeader>
                                <div className="mx-auto bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center mb-4">
                                    <feature.icon className="h-8 w-8" />
                                </div>
                                <CardTitle>{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                
                 <Card className="max-w-4xl mx-auto bg-card shadow-lg border-none">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl sm:text-3xl">Let's Create Together</CardTitle>
                        <CardDescription>
                            We're excited to learn about your needs. Reach out to us to start the conversation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href={`https://wa.me/${B2B_WHATSAPP_NUMBER}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full">
                                <MessageSquare className="mr-2 h-5 w-5" />
                                Chat on WhatsApp
                            </Button>
                        </Link>
                         <div className="relative flex items-center sm:w-auto w-full">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase sm:w-auto w-full">
                                <span className="bg-card px-2 text-muted-foreground">OR</span>
                            </div>
                        </div>
                        <a href={`mailto:${B2B_SUPPORT_EMAIL}`} className="w-full sm:w-auto">
                           <Button variant="outline" size="lg" className="w-full">
                                Email Us
                            </Button>
                        </a>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
