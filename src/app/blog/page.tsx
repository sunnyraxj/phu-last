
'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { Header } from '@/components/shared/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type Blog = {
    id: string;
    title: string;
    slug: string;
    content: string;
    status: 'draft' | 'published';
    createdAt: Timestamp;
};

export default function BlogListPage() {
    const firestore = useFirestore();

    const blogsQuery = useMemoFirebase(() => query(collection(firestore, 'blogs'), where('status', '==', 'published')), [firestore]);
    const { data: blogs, isLoading: blogsLoading } = useCollection<Blog>(blogsQuery);

    const formatDate = (timestamp?: Timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    return (
        <div className="bg-background min-h-screen">
            <Header userData={null} cartItems={[]} updateCartItemQuantity={() => {}} />

            <main className="container mx-auto py-8 sm:py-12 px-4">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Our Blog</h1>
                    <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto sm:text-xl">
                        Stories, insights, and updates from the world of North-Eastern handicrafts.
                    </p>
                </div>

                {blogsLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <PottersWheelSpinner />
                    </div>
                ) : blogs && blogs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {blogs.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds).map((post) => (
                            <Card key={post.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className="leading-tight">{post.title}</CardTitle>
                                    <CardDescription>{formatDate(post.createdAt)}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-muted-foreground line-clamp-3">
                                        {post.content}
                                    </p>
                                </CardContent>
                                <CardFooter>
                                    <Link href={`/blog/${post.slug}`} className="w-full">
                                        <Button className="w-full">Read More</Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center h-64 flex flex-col items-center justify-center">
                        <p className="text-muted-foreground">No blog posts have been published yet.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
