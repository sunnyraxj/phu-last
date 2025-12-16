
'use client';

import { useState, useCallback } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { BlogForm } from '@/components/admin/BlogForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

type Blog = {
    id: string;
    title: string;
    slug: string;
    content: string;
    featuredImage: string;
    status: 'draft' | 'published';
    createdAt: Timestamp;
    faqs?: { question: string, answer: string }[];
};

type BlogFormData = Omit<Blog, 'id' | 'createdAt'>;


export default function BlogPage() {
    const firestore = useFirestore();
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Blog | null>(null);
    const [postToDelete, setPostToDelete] = useState<Blog | null>(null);

    const blogsQuery = useMemoFirebase(() => collection(firestore, 'blogs'), [firestore]);
    const { data: blogs, isLoading: blogsLoading } = useCollection<Blog>(blogsQuery);

    const handleAddPost = () => {
        setSelectedPost(null);
        setIsFormOpen(true);
    };

    const handleEditPost = (post: Blog) => {
        setSelectedPost(post);
        setIsFormOpen(true);
    };

    const handleDeletePost = async () => {
        if (postToDelete) {
            const postRef = doc(firestore, 'blogs', postToDelete.id);
            deleteDocumentNonBlocking(postRef);
            setPostToDelete(null);
        }
    };
    
    const handleFormSubmit = useCallback((formData: BlogFormData) => {
        if (selectedPost) {
            const postRef = doc(firestore, "blogs", selectedPost.id);
            setDocumentNonBlocking(postRef, formData, { merge: true });
        } else {
            const blogsCollection = collection(firestore, "blogs");
            addDocumentNonBlocking(blogsCollection, { ...formData, createdAt: serverTimestamp() });
        }
        setIsFormOpen(false);
        setSelectedPost(null);
    }, [firestore, selectedPost]);

    const handleCloseForm = useCallback(() => {
        setIsFormOpen(false);
    }, []);

    const formatDate = (timestamp?: Timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    return (
        <div className="flex-1 space-y-4 p-2 sm:p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Blog</h2>
                <Button onClick={handleAddPost}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Blog Post
                </Button>
            </div>

            <BlogForm
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                onSubmit={handleFormSubmit}
                post={selectedPost}
            />
            
            <Card>
                <CardHeader>
                    <CardTitle>All Blog Posts</CardTitle>
                    <CardDescription>Manage your blog content here.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {blogsLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <PottersWheelSpinner />
                                        </TableCell>
                                    </TableRow>
                                ) : blogs && blogs.length > 0 ? (
                                    blogs.map((post) => (
                                        <TableRow key={post.id}>
                                            <TableCell className="font-medium">
                                                <Link href={`/blog/${post.slug}`} target="_blank" className="hover:underline">
                                                    {post.title}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="capitalize">
                                                    {post.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{formatDate(post.createdAt)}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEditPost(post)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => setPostToDelete(post)}>
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No blog posts found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={!!postToDelete} onOpenChange={(isOpen) => !isOpen && setPostToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the blog post.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPostToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeletePost} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
