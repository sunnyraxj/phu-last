export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container py-12 md:py-16">
        <div className="mb-8">
            <h1 className="font-headline text-4xl font-bold">Artisan Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage your products, orders, and profile.</p>
        </div>
        {children}
    </div>
  );
}
