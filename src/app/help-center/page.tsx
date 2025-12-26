
'use client';

import { useMemo } from "react";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Header } from "@/components/shared/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, Copy } from "lucide-react";
import Link from "next/link";
import { PottersWheelSpinner } from "@/components/shared/PottersWheelSpinner";
import { useToast } from "@/hooks/use-toast";

const WHATSAPP_NUMBER = '918638098776'; 
const SUPPORT_EMAIL = 'purbanchalhastaudyog@gmail.com'; 

type UserProfile = {
    firstName: string;
    lastName: string;
};

export default function HelpCenterPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const userDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'users', user.uid) : null),
        [firestore, user]
    );
    const { data: userData, isLoading: userDataLoading } = useDoc<UserProfile>(userDocRef);

    const whatsappMessage = useMemo(() => {
        if (!user || !userData) {
            return "Hello, I have a question.";
        }
        const name = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
        const template = `Hello, I have a question.\n\nName: ${name}\nEmail: ${user.email}`;
        return encodeURIComponent(template);
    }, [user, userData]);
    
    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({
                title: `${label} Copied!`,
                description: `${text} has been copied to your clipboard.`
            })
        }, () => {
             toast({
                variant: 'destructive',
                title: 'Failed to Copy',
                description: `Could not copy ${label} to clipboard.`
            })
        })
    }

    if (isUserLoading || userDataLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <PottersWheelSpinner />
            </div>
        )
    }

    return (
        <div className="bg-background">
            <Header />

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
                        <CardContent className="text-center flex flex-col items-center gap-4">
                            <div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
                                <p className="font-mono text-lg">{WHATSAPP_NUMBER}</p>
                                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(WHATSAPP_NUMBER, 'WhatsApp Number')}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                             <Link href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer">
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
                        <CardContent className="text-center flex flex-col items-center gap-4">
                            <div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
                                <p className="font-mono text-lg">{SUPPORT_EMAIL}</p>
                                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(SUPPORT_EMAIL, 'Email Address')}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
