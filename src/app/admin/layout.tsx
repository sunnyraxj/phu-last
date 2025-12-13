
'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { collection, doc } from 'firebase/firestore';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { Button } from '@/components/ui/button';
import { Home, Package, ShoppingCart, Users, Store, Menu, Settings, Undo2, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';

type Order = {
    status: 'pending' | 'shipped' | 'delivered' | 'pending-payment-approval';
};

type Product = {
    inStock: boolean;
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
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userData, isLoading: isUserDocLoading } = useDoc<{ role: string }>(userDocRef);

    const ordersQuery = useMemoFirebase(() => (isAuthorized ? collection(firestore, 'orders') : null), [firestore, isAuthorized]);
    const { data: orders } = useCollection<Order>(ordersQuery);
    
    const productsQuery = useMemoFirebase(() => (isAuthorized ? collection(firestore, 'products') : null), [firestore, isAuthorized]);
    const { data: products } = useCollection<Product>(productsQuery);
    
    const returnsQuery = useMemoFirebase(() => (isAuthorized ? collection(firestore, 'returnRequests') : null), [firestore, isAuthorized]);
    const { data: returnRequests } = useCollection<ReturnRequest>(returnsQuery);

    const pendingOrdersCount = useMemo(() => {
        if (!orders) return 0;
        return orders.filter(order => order.status === 'pending' || order.status === 'pending-payment-approval').length;
    }, [orders]);

    const outOfStockCount = useMemo(() => {
        if (!products) return 0;
        return products.filter(product => !product.inStock).length;
    }, [products]);
    
    const pendingReturnsCount = useMemo(() => {
        if (!returnRequests) return 0;
        return returnRequests.filter(req => req.status === 'pending-review').length;
    }, [returnRequests]);


    useEffect(() => {
        const checkAuth = () => {
            if (isUserLoading || isUserDocLoading) {
                return;
            }

            if (!user) {
                router.push('/login?redirect=/admin');
                return;
            }

            if (userData?.role === 'admin') {
                setIsAuthorized(true);
            } else {
                setIsAuthorized(false);
            }
            setIsCheckingAuth(false);
        };

        checkAuth();
    }, [user, userData, isUserLoading, isUserDocLoading, router]);
    
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname])

    if (isCheckingAuth) {
        return (
            <div className="flex h-screen items-center justify-center">
                <PottersWheelSpinner />
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background text-center p-4">
                <h1 className="text-3xl sm:text-4xl font-bold text-destructive">Access Denied</h1>
                <p className="mt-4 text-base sm:text-lg text-muted-foreground">You do not have permission to view this page.</p>
                <Button onClick={() => router.push('/')} className="mt-8">Go to Homepage</Button>
            </div>
        );
    }
    
    const navGroups = [
        {
            items: [
                { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            ]
        },
        {
            title: 'Store Management',
            items: [
                { href: '/admin', label: 'Products', icon: Package, badge: outOfStockCount > 0 ? outOfStockCount : null, badgeVariant: 'destructive' as const },
                { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, badge: pendingOrdersCount > 0 ? pendingOrdersCount : null, badgeVariant: 'default' as const },
                { href: '/admin/returns', label: 'Returns', icon: Undo2, badge: pendingReturnsCount > 0 ? pendingReturnsCount : null, badgeVariant: 'destructive' as const },
            ]
        },
        {
            title: 'Content',
            items: [
                { href: '/admin/team', label: 'Our Team', icon: Users },
                { href: '/admin/store', label: 'Our Store', icon: Store },
            ]
        },
        {
            title: 'General',
            items: [
                { href: '/admin/settings', label: 'Settings', icon: Settings },
            ]
        }
    ];

    const navContent = (
        <nav className="flex flex-col gap-4">
            {navGroups.map((group, index) => (
                 <div key={index} className="flex flex-col gap-1">
                    {group.title && <h3 className="px-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">{group.title}</h3>}
                    <ul className="space-y-1">
                        {group.items.map((item) => (
                            <li key={item.href}>
                                <Link href={item.href}>
                                    <span className={cn(
                                        "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-base text-foreground transition-all hover:text-primary hover:bg-muted",
                                        pathname === item.href && "bg-muted text-primary font-semibold",
                                        pathname === '/admin' && item.href === '/admin' && "bg-muted text-primary font-semibold"
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
        <div className="grid min-h-screen w-full md:grid-cols-[320px_1fr]">
            <aside className="hidden border-r bg-background md:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-6">
                        <Link href="/" className="flex items-center gap-2 font-semibold">
                             <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                                <span className="text-lg font-bold">P</span>
                            </div>
                            <span className="text-lg">Hasta Udyog Admin</span>
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
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                     <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col p-0">
                           <div className="flex h-14 items-center border-b px-6">
                                <Link href="/" className="flex items-center gap-2 font-semibold">
                                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                                        <span className="text-lg font-bold">P</span>
                                    </div>
                                    <span className="text-lg">Admin</span>
                                </Link>
                            </div>
                             <div className="flex-1 overflow-y-auto py-4">
                                {navContent}
                            </div>
                             <div className="mt-auto p-4 border-t">
                                <Link href="/">
                                    <Button variant="ghost" className="w-full justify-start text-base">
                                        <Home className="mr-2 h-5 w-5" />
                                        Back to Store
                                    </Button>
                                </Link>
                            </div>
                        </SheetContent>
                    </Sheet>
                    <div className="w-full flex-1">
                        {/* Can add a search bar here if needed */}
                    </div>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
