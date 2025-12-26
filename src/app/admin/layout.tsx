
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, doc, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Home, Package, ShoppingCart, Users, Store, Menu, Settings, Undo2, LayoutDashboard, FileText, ShieldAlert, Brush } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Header } from '@/components/shared/Header';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';

type Order = {
    status: 'pending' | 'shipped' | 'delivered' | 'pending-payment-approval' | 'order-confirmed';
};

type ReturnRequest = {
    status: 'pending-review';
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const userDocRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
    const { data: userData, isLoading: isUserDocLoading } = useDoc<{ role: string }>(userDocRef);

    const ordersQuery = useMemoFirebase(() => (user ? query(collection(firestore, 'orders'), where('status', 'in', ['pending', 'pending-payment-approval', 'order-confirmed'])) : null), [firestore, user]);
    const { data: orders } = useCollection<Order>(ordersQuery);
    
    const returnsQuery = useMemoFirebase(() => (user ? query(collection(firestore, 'returnRequests'), where('status', '==', 'pending-review')) : null), [firestore, user]);
    const { data: returnRequests } = useCollection<ReturnRequest>(returnsQuery);
    
    const storesQuery = useMemoFirebase(() => collection(firestore, 'stores'), [firestore]);
    const { data: stores } = useCollection<Store>(storesQuery);

    const pendingOrdersCount = useMemo(() => orders?.length || 0, [orders]);
    const pendingReturnsCount = useMemo(() => returnRequests?.length || 0, [returnRequests]);

    const adminActionCounts = useMemo(() => {
        return {
            pendingOrders: pendingOrdersCount,
            outOfStockProducts: 0,
            pendingReturns: pendingReturnsCount,
        };
    }, [pendingOrdersCount, pendingReturnsCount]);
    
    const handleCloseMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(false);
    }, []);

    useEffect(() => {
        handleCloseMobileMenu();
    }, [pathname, handleCloseMobileMenu]);


    const navGroups = [
        {
            items: [
                { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            ]
        },
        {
            title: 'Store Management',
            items: [
                { href: '/admin/items', label: 'Items', icon: Package },
                { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, badge: pendingOrdersCount > 0 ? pendingOrdersCount : null, badgeVariant: 'default' as const },
                { href: '/admin/returns', label: 'Returns', icon: Undo2, badge: pendingReturnsCount > 0 ? pendingReturnsCount : null, badgeVariant: 'destructive' as const },
            ]
        },
        {
            title: 'Content',
            items: [
                { href: '/admin/team', label: 'Our Team', icon: Users },
                { href: '/admin/store', label: 'Our Store', icon: Store },
                { href: '/admin/materials', label: 'Content Settings', icon: Brush },
            ]
        },
        {
            title: 'General',
            items: [
                { href: '/admin/settings', label: 'Settings', icon: Settings },
            ]
        }
    ];

    // Authorization Guard
    useEffect(() => {
        // Redirect to login if not authenticated after loading has finished
        if (!isUserLoading && !user) {
            router.push('/login?redirect=/admin/dashboard');
        }
    }, [isUserLoading, user, router]);
    
    const isLoading = isUserLoading || isUserDocLoading;

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <PottersWheelSpinner />
            </div>
        );
    }
    
    // After loading, if user is not an admin, show access denied message
    if (!isLoading && userData?.role !== 'admin') {
         return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background p-4 text-center">
                <ShieldAlert className="h-16 w-16 text-destructive" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="max-w-md text-muted-foreground">
                    You do not have the necessary permissions to access this page. Please contact an administrator if you believe this is an error.
                </p>
                <Link href="/">
                    <Button variant="outline">Go to Homepage</Button>
                </Link>
            </div>
        );
    }


    const navContent = (
        <nav className="flex flex-col gap-4">
            {navGroups.map((group, index) => (
                 <div key={index} className="flex flex-col gap-1">
                    {group.title && <h3 className="px-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">{group.title}</h3>}
                    <ul className="space-y-1">
                        {group.items.map((item) => (
                            <li key={item.href}>
                                <Link href={item.href} onClick={handleCloseMobileMenu}>
                                    <span className={cn(
                                        "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-base text-foreground transition-all hover:text-primary hover:bg-muted",
                                        pathname === item.href ? "bg-muted text-primary font-semibold" : ""
                                    )}>
                                        <div className="flex items-center gap-3">
                                            <item.icon className="h-5 w-5" />
                                            {item.label}
                                        </div>
                                        {item.badge != null && <Badge variant={item.badgeVariant} className="h-5">{item.badge}</Badge>}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </nav>
    );

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[320px_1fr] bg-muted/40">
             <aside className="hidden border-r bg-background md:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-24 items-center border-b px-6">
                         <Link href="/" className="flex items-center gap-3">
                            <span className="text-lg font-semibold whitespace-nowrap">Purbanchal Hasta Udyog</span>
                        </Link>
                    </div>
                    <div className="flex-1 overflow-y-auto py-4">
                        {navContent}
                    </div>
                     <div className="mt-auto p-4">
                        <Link href="/">
                            <Button variant="ghost" className="w-full justify-start text-base">
                                <Home className="mr-2 h-5 w-5" />
                                Back to Store
                            </Button>
                        </Link>
                    </div>
                </div>
            </aside>
            <div className="flex flex-col">
                 <Header
                    showAnnouncement={false}
                />
                <main className="flex-1 overflow-auto bg-background">
                    <div className="container mx-auto px-4 sm:px-8 py-4">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
