
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { collection, doc, query, where } from 'firebase/firestore';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { Button } from '@/components/ui/button';
import { Home, Package, ShoppingCart, Users, Store, Menu, Settings, Undo2, LayoutDashboard, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Header } from '@/components/shared/Header';

type Order = {
    status: 'pending' | 'shipped' | 'delivered' | 'pending-payment-approval' | 'order-confirmed';
};

type Product = {
    id: string;
    inStock: boolean;
};

type ReturnRequest = {
    status: 'pending-review';
}

type CartItem = Product & { productId: string; quantity: number; cartItemId: string; };

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
    
    const [authStatus, setAuthStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');

    const userDocRef = useMemoFirebase(() => (user && !user.isAnonymous) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userData, isLoading: isUserDocLoading } = useDoc<{ role: string }>(userDocRef);
    
    useEffect(() => {
        if (isUserLoading || (user && !user.isAnonymous && isUserDocLoading)) {
            setAuthStatus('loading');
            return;
        }

        if (!user || user.isAnonymous || userData?.role !== 'admin') {
            setAuthStatus('unauthorized');
        } else {
            setAuthStatus('authorized');
        }
    }, [user, userData, isUserLoading, isUserDocLoading]);
    
    useEffect(() => {
        if (authStatus === 'unauthorized') {
            router.push('/');
        }
    }, [authStatus, router]);
    
    const isAuthorizedAdmin = authStatus === 'authorized';

    const ordersQuery = useMemoFirebase(() => (isAuthorizedAdmin ? query(collection(firestore, 'orders'), where('status', 'in', ['pending', 'pending-payment-approval', 'order-confirmed'])) : null), [firestore, isAuthorizedAdmin]);
    const { data: orders } = useCollection<Order>(ordersQuery);
    
    const productsQuery = useMemoFirebase(() => (isAuthorizedAdmin ? query(collection(firestore, 'products'), where('inStock', '==', false)) : null), [firestore, isAuthorizedAdmin]);
    const { data: products } = useCollection<Product>(productsQuery);
    
    const returnsQuery = useMemoFirebase(() => (isAuthorizedAdmin ? query(collection(firestore, 'returnRequests'), where('status', '==', 'pending-review')) : null), [firestore, isAuthorizedAdmin]);
    const { data: returnRequests } = useCollection<ReturnRequest>(returnsQuery);
    
    const storesQuery = useMemoFirebase(() => collection(firestore, 'stores'), [firestore]);
    const { data: stores } = useCollection<Store>(storesQuery);

    const pendingOrdersCount = useMemo(() => orders?.length || 0, [orders]);
    const outOfStockCount = useMemo(() => products?.length || 0, [products]);
    const pendingReturnsCount = useMemo(() => returnRequests?.length || 0, [returnRequests]);

    const adminActionCounts = useMemo(() => {
        return {
            pendingOrders: pendingOrdersCount,
            outOfStockProducts: outOfStockCount,
            pendingReturns: pendingReturnsCount,
        };
    }, [pendingOrdersCount, outOfStockCount, pendingReturnsCount]);
    
    useEffect(() => {
        if(isMobileMenuOpen) setIsMobileMenuOpen(false);
    }, [pathname])

    if (authStatus !== 'authorized') {
        return (
            <div className="flex h-screen items-center justify-center">
                <PottersWheelSpinner />
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
                { href: '/admin/blog', label: 'Blog', icon: FileText },
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
                                        pathname.startsWith(item.href) && item.href !== '/admin' && "bg-muted text-primary font-semibold",
                                        pathname === '/admin' && item.href === '/admin' && "bg-muted text-primary font-semibold",
                                        pathname === item.href && "bg-muted text-primary font-semibold"
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
                    userData={userData}
                    cartItems={[]} // Cart is handled outside admin
                    updateCartItemQuantity={() => {}}
                    stores={stores || []}
                    products={[]}
                    adminActionCounts={adminActionCounts}
                />
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto bg-background">
                    {children}
                </main>
            </div>
        </div>
    );
}
