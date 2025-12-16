
'use client';

import { useState, useCallback } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { BlogForm, type BlogFormValues } from '@/components/admin/BlogForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type Blog = {
    id: string;
    title: string;
    slug: string;
    content: string;
    featuredImage: string;
    status: 'draft' | 'published';
    createdAt?: Timestamp;
    faqs?: { question: string, answer: string }[];
};

export default function BlogPage() {
    const firestore = useFirestore();
    
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);
    const [isEditFormOpen, setIsEditFormOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Blog | null>(null);
    const [postToDelete, setPostToDelete] = useState<Blog | null>(null);

    const blogsQuery = useMemoFirebase(() => collection(firestore, 'blogs'), [firestore]);
    const { data: blogs, isLoading: blogsLoading } = useCollection<Blog>(blogsQuery);

    const handleEditClick = (post: Blog) => {
        setSelectedPost(post);
        setIsEditFormOpen(true);
    };

    const handleDeletePost = async () => {
        if (postToDelete) {
            const postRef = doc(firestore, 'blogs', postToDelete.id);
            deleteDocumentNonBlocking(postRef);
            setPostToDelete(null);
        }
    };
    
    const handleAddSubmit = (formData: BlogFormValues) => {
        const blogsCollection = collection(firestore, "blogs");
        const dataWithTimestamp = { ...formData, createdAt: serverTimestamp() };
        addDocumentNonBlocking(blogsCollection, dataWithTimestamp);
        setIsAddFormOpen(false);
    };
    
    const handleEditSubmit = (formData: BlogFormValues) => {
        if (selectedPost) {
            const postRef = doc(firestore, "blogs", selectedPost.id);
            // Ensure createdAt is not part of the update data
            const { createdAt, ...updateData } = formData as Partial<Blog>;
            setDocumentNonBlocking(postRef, updateData, { merge: true });
        }
        setIsEditFormOpen(false);
        setSelectedPost(null);
    };
    
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
                <Dialog open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Blog Post
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Add New Post</DialogTitle>
                            <DialogDescription>
                                Fill out the form to add a new post.
                            </DialogDescription>
                        </DialogHeader>
                        <BlogForm
                            onSuccess={handleAddSubmit}
                            post={null}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Edit Dialog - not triggered by button, controlled by state */}
            <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Edit Post</DialogTitle>
                        <DialogDescription>
                            Update the details of this blog post.
                        </DialogDescription>
                    </DialogHeader>
                    <BlogForm
                        onSuccess={handleEditSubmit}
                        post={selectedPost}
                    />
                </DialogContent>
            </Dialog>
            
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
                                                        <DropdownMenuItem onClick={() => handleEditClick(post)}>
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
