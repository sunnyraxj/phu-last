
'use client';

import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect } from 'react';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const blogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase and contain only letters, numbers, and hyphens'),
  content: z.string().min(1, 'Content is required'),
  status: z.enum(['draft', 'published']),
});

type BlogFormValues = z.infer<typeof blogSchema>;

interface BlogFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BlogFormValues) => void;
  post: (BlogFormValues & { id?: string }) | null;
}

export function BlogForm({ isOpen, onClose, onSubmit, post }: BlogFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: '',
      slug: '',
      content: '',
      status: 'draft',
    },
  });

  const titleValue = watch('title');

  useEffect(() => {
    if (isOpen) {
        if (post) {
          reset(post);
        } else {
          reset({
            title: '',
            slug: '',
            content: '',
            status: 'draft',
          });
        }
    }
  }, [post, reset, isOpen]);

  useEffect(() => {
      if (!post) { // Only auto-generate slug for new posts
          const slug = titleValue.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          setValue('slug', slug, { shouldValidate: true });
      }
  }, [titleValue, setValue, post]);

  const handleFormSubmit: SubmitHandler<BlogFormValues> = (data) => {
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{post ? 'Edit Post' : 'Add New Post'}</DialogTitle>
          <DialogDescription>
            {post ? "Update the details of this blog post." : "Fill out the form to add a new post."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
            <ScrollArea className="h-[60vh] pr-6 -mr-6">
                <div className="space-y-4 my-4">
                    <div className="space-y-1">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" {...register('title')} />
                        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="slug">Slug</Label>
                        <Input id="slug" {...register('slug')} />
                        {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="content">Content</Label>
                        <Textarea id="content" {...register('content')} rows={10} />
                        {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label>Status</Label>
                        <Controller
                            control={control}
                            name="status"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="published">Published</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
                    </div>
                </div>
            </ScrollArea>

            <DialogFooter className="mt-4 pt-4 border-t">
                <DialogClose asChild>
                    <Button type="button" variant="outline">
                    Cancel
                    </Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Post'}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
