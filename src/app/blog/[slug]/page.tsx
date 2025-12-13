
'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type FAQ = {
    question: string;
    answer: string;
}

type Blog = {
    id: string;
    title: string;
    slug: string;
    content: string;
    status: 'draft' | 'published';
    createdAt: Timestamp;
    faqs?: FAQ[];
};

function FaqSchema({ faqs, blogTitle }: { faqs: FAQ[]; blogTitle: string }) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}


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
            {post && post.faqs && post.faqs.length > 0 && <FaqSchema faqs={post.faqs} blogTitle={post.title} />}
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
                        
                        {post.faqs && post.faqs.length > 0 && (
                            <section className="mt-12">
                                <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
                                <Accordion type="single" collapsible className="w-full">
                                    {post.faqs.map((faq, index) => (
                                        <AccordionItem key={index} value={`item-${index}`}>
                                            <AccordionTrigger>{faq.question}</AccordionTrigger>
                                            <AccordionContent>
                                                {faq.answer}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </section>
                        )}

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
