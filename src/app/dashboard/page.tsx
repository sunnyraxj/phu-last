import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListOrdered, Package } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Welcome back!</CardTitle>
                    <CardDescription>Here's a quick overview of your shop.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>You can manage all aspects of your artisan profile and products from this dashboard.</p>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Order Management
                        </CardTitle>
                        <ListOrdered className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3 Pending</div>
                        <p className="text-xs text-muted-foreground">
                            You have 3 new orders to fulfill.
                        </p>
                    </CardContent>
                    <CardContent>
                        <Button asChild>
                            <Link href="/dashboard/orders">View All Orders</Link>
                        </Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Product Listings
                        </CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">5 Active</div>
                        <p className="text-xs text-muted-foreground">
                            You have 5 products currently listed for sale.
                        </p>
                    </CardContent>
                    <CardContent>
                        <Button variant="outline">Manage Products</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
