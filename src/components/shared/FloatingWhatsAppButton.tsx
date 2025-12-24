
'use client';

import { useMemo, useState } from 'react';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MessageSquare, ShoppingBasket, Sparkles, X } from 'lucide-react';


const WhatsAppIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 448 512"
      fill="currentColor"
      className="h-8 w-8"
    >
      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.8 0-65.7-10.8-94-31.4l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.9 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
    </svg>
);

const WHATSAPP_NUMBER = '918638098776';

type UserProfile = {
    firstName: string;
    lastName: string;
};

export function FloatingWhatsAppButton() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [isOpen, setIsOpen] = useState(false);

    const userDocRef = useMemoFirebase(
        () => (user && !user.isAnonymous ? doc(firestore, 'users', user.uid) : null),
        [firestore, user]
    );
    const { data: userData } = useDoc<UserProfile>(userDocRef);

    const baseMessage = useMemo(() => {
        let message = "";
        if (user && !user.isAnonymous && userData) {
            const name = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
            if (name) {
                message += `\n\nName: ${name}`;
            }
            if (user.email) {
                message += `\nEmail: ${user.email}`;
            }
        }
        return message;
    }, [user, userData]);

    const templates = [
        {
            icon: MessageSquare,
            title: 'Product Quality',
            message: `Hello, I have a question about product quality.${baseMessage}`
        },
        {
            icon: Sparkles,
            title: 'Custom Order',
            message: `Hello, I would like to inquire about a custom order.${baseMessage}`
        }
    ];

    const generateWhatsAppLink = (message: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                 <Button
                    className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 focus:ring-2 focus:ring-green-400 focus:ring-offset-2 z-50"
                >
                    {isOpen ? <X className="h-8 w-8" /> : <WhatsAppIcon />}
                    <span className="sr-only">Contact us on WhatsApp</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 mr-4 mb-2 p-0 bg-transparent border-none shadow-none">
                <div className="rounded-lg bg-background p-2 shadow-lg">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none px-2 pt-2">Hello!</h4>
                        <p className="text-sm text-muted-foreground px-2">
                            How can we help you today?
                        </p>
                    </div>
                    <div className="grid gap-1 mt-2">
                        {templates.map((template) => (
                            <Link href={generateWhatsAppLink(template.message)} target="_blank" rel="noopener noreferrer" key={template.title}>
                                <Button variant="ghost" className="w-full justify-start">
                                    <template.icon className="mr-2 h-4 w-4" />
                                    {template.title}
                                </Button>
                            </Link>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
