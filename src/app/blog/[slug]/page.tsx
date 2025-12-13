
'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { Header } from '@/components/shared/Header';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Blog = {
    id: string;
    title: string;
    slug: string;
    content: string;
    status: 'draft' | 'published';
    createdAt: Timestamp;
};

export default function BlogPostPage() {
    const { slug } = useParams();
    const firestore = useFirestore();

    const blogQuery = useMemoFirebase(
        () => slug ? query(collection(firestore, 'blogs'), where('slug', '==', slug), where('status', '==', 'published')) : null,
        [firestore, slug]
    );
    const { data: blogData, isLoading: blogLoading } = useCollection<Blog>(blogQuery);

    const post = blogData?.[0];

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
                {blogLoading ? (
                    <div className="flex justify-center items-center h-96">
                        <PottersWheelSpinner />
                    </div>
                ) : post ? (
                    <article className="max-w-3xl mx-auto">
                        <header className="mb-8">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">{post.title}</h1>
                            <p className="text-muted-foreground">{formatDate(post.createdAt)}</p>
                        </header>
                        <div className="prose dark:prose-invert max-w-none prose-lg">
                            <p>{post.content}</p>
                        </div>
                         <div className="mt-12 text-center">
                            <Link href="/blog">
                                <Button variant="outline">Back to Blog</Button>
                            </Link>
                        </div>
                    </article>
                ) : (
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold">Post not found</h2>
                        <p className="text-muted-foreground mt-2">The requested blog post could not be found or has not been published.</p>
                         <Link href="/blog" className="mt-6 inline-block">
                            <Button>Back to Blog</Button>
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
