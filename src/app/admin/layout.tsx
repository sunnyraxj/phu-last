'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { collection, doc } from 'firebase/firestore';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { Button } from '@/components/ui/button';
import { Home, Package, ShoppingCart, Users, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type Order = {
    status: 'pending' | 'shipped' | 'delivered';
};

type Product = {
    inStock: boolean;
};

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

    const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userData, isLoading: isUserDocLoading } = useDoc<{ role: string }>(userDocRef);

    const ordersQuery = useMemoFirebase(() => collection(firestore, 'orders'), [firestore]);
    const { data: orders } = useCollection<Order>(ordersQuery);
    
    const productsQuery = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
    const { data: products } = useCollection<Product>(productsQuery);

    const pendingOrdersCount = useMemo(() => {
        if (!orders) return 0;
        return orders.filter(order => order.status === 'pending').length;
    }, [orders]);

    const outOfStockCount = useMemo(() => {
        if (!products) return 0;
        return products.filter(product => !product.inStock).length;
    }, [products]);


    useEffect(() => {
        const checkAuth = () => {
            if (isUserLoading || isUserDocLoading) {
                return;
            }

            if (!user) {
                router.push('/login');
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

    if (isCheckingAuth) {
        return (
            <div className="flex h-screen items-center justify-center">
                <PottersWheelSpinner />
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background text-center">
                <h1 className="text-4xl font-bold text-destructive">Access Denied</h1>
                <p className="mt-4 text-lg text-muted-foreground">You do not have permission to view this page.</p>
                <Button onClick={() => router.push('/')} className="mt-8">Go to Homepage</Button>
            </div>
        );
    }
    
    const navItems = [
        { href: '/admin', label: 'Products', icon: Package, badge: outOfStockCount > 0 ? outOfStockCount : null, badgeVariant: 'destructive' as const },
        { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, badge: pendingOrdersCount > 0 ? pendingOrdersCount : null, badgeVariant: 'default' as const },
        { href: '/admin/team', label: 'Our Team', icon: Users },
        { href: '/admin/store', label: 'Our Store', icon: Store },
    ];

    return (
        <div className="flex min-h-screen w-full">
            <aside className="w-64 flex-col border-r bg-background hidden md:flex">
                <div className="flex h-[60px] items-center border-b px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                         <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                            <span className="text-lg font-bold">P</span>
                        </div>
                        <span className="">Hasta Udyog Admin</span>
                    </Link>
                </div>
                <nav className="flex-1 p-4">
                    <ul className="space-y-1">
                        {navItems.map((item) => (
                            <li key={item.href}>
                                <Link href={item.href}>
                                    <span className={cn(
                                        "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                        pathname === item.href && "bg-muted text-primary"
                                    )}>
                                        <div className="flex items-center gap-3">
                                            <item.icon className="h-4 w-4" />
                                            {item.label}
                                        </div>
                                        {item.badge && <Badge variant={item.badgeVariant}>{item.badge}</Badge>}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
                 <div className="mt-auto p-4">
                    <Link href="/">
                        <Button variant="ghost" className="w-full justify-start">
                            <Home className="mr-2 h-4 w-4" />
                            Back to Store
                        </Button>
                    </Link>
                </div>
            </aside>
            <div className="flex flex-col flex-1">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6 lg:h-[60px]">
                    {/* Header content for mobile, e.g., menu button */}
                </header>
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
