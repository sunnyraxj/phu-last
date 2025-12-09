import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { products } from '@/lib/placeholder-data';
import Image from 'next/image';

export default function CheckoutPage() {
    const cartItem = products[0];
    const subtotal = cartItem.price;
    const shipping = 5.00;
    const total = subtotal + shipping;

    return (
        <div className="container py-12 md:py-16">
            <div className="text-center mb-12">
                <h1 className="font-headline text-4xl md:text-5xl font-bold">Checkout</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Shipping Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input id="firstName" placeholder="Enter your first name" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" placeholder="Enter your last name" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input id="address" placeholder="Enter your address" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input id="city" placeholder="Enter your city" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="zip">ZIP Code</Label>
                                <Input id="zip" placeholder="Enter your ZIP code" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>Payment Method</CardTitle>
                            <CardDescription>This is a placeholder. No real transaction will be made.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button variant="outline" className="w-full" disabled>Pay with Credit Card</Button>
                            <Button variant="outline" className="w-full" disabled>Pay with UPI</Button>
                            <Button variant="outline" className="w-full" disabled>Pay with Netbanking</Button>
                        </CardContent>
                    </Card>
                </div>
                <div>
                    <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <div className="relative h-16 w-16 rounded-md overflow-hidden">
                                <Image
                                    src={cartItem.images[0].imageUrl}
                                    alt={cartItem.images[0].description}
                                    fill
                                    className="object-cover"
                                    data-ai-hint={cartItem.images[0].imageHint}
                                />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">{cartItem.name}</p>
                                    <p className="text-sm text-muted-foreground">Qty: 1</p>
                                </div>
                                <p className="font-semibold">${cartItem.price.toFixed(2)}</p>
                            </div>
                            <Separator />
                             <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping</span>
                                    <span>${shipping.toFixed(2)}</span>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" disabled>Place Order</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
