
'use client';

import { useForm, SubmitHandler, Controller, useFieldArray } from 'react-hook-form';
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
import { useEffect, useRef, useState } from 'react';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { PlusCircle, Trash2, UploadCloud } from 'lucide-react';
import { PottersWheelSpinner } from '../shared/PottersWheelSpinner';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const faqSchema = z.object({
    question: z.string().min(1, 'Question is required'),
    answer: z.string().min(1, 'Answer is required'),
});

const blogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase and contain only letters, numbers, and hyphens'),
  content: z.string().min(1, 'Content is required'),
  featuredImage: z.string().min(1, 'A featured image is required.'),
  status: z.enum(['draft', 'published']),
  faqs: z.array(faqSchema).optional(),
});

type BlogFormValues = z.infer<typeof blogSchema>;

interface BlogFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BlogFormValues) => void;
  post: (BlogFormValues & { id?: string, faqs?: { question: string, answer: string }[] }) | null;
}

export function BlogForm({ isOpen, onClose, onSubmit, post }: BlogFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
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
      featuredImage: '',
      status: 'draft',
      faqs: [],
    },
  });
  
  const imageValue = watch('featuredImage');
  const titleValue = watch('title');

  const { fields, append, remove } = useFieldArray({
      control,
      name: "faqs",
  });

  useEffect(() => {
    if (isOpen) {
        if (post) {
          reset({
              ...post,
              faqs: post.faqs || [],
          });
        } else {
          reset({
            title: '',
            slug: '',
            content: '',
            featuredImage: '',
            status: 'draft',
            faqs: [],
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
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await fetch(`/api/upload?filename=${file.name}`, {
        method: 'POST',
        body: file,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const newBlob = await response.json();
      setValue('featuredImage', newBlob.url, { shouldValidate: true });
      toast({
        title: 'Image Uploaded',
        description: 'The featured image has been successfully uploaded.',
      });

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message,
      });
    } finally {
      setIsUploading(false);
       if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };


  const handleFormSubmit: SubmitHandler<BlogFormValues> = (data) => {
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{post ? 'Edit Post' : 'Add New Post'}</DialogTitle>
          <DialogDescription>
            {post ? "Update the details of this blog post." : "Fill out the form to add a new post."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
            <ScrollArea className="h-[70vh] pr-6 -mr-6">
                <div className="space-y-6 my-4">
                    <div>
                        <h3 className="text-lg font-medium mb-2">Basic Details</h3>
                        <div className="space-y-4 p-4 border rounded-lg">
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
                                <Label htmlFor="featuredImage">Featured Image</Label>
                                <div 
                                    className="relative flex justify-center items-center w-full h-48 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {isUploading ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <PottersWheelSpinner />
                                            <p className="text-sm text-muted-foreground">Uploading...</p>
                                        </div>
                                    ) : imageValue ? (
                                        <Image src={imageValue} alt="Featured image preview" fill className="object-cover rounded-md" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <UploadCloud className="h-8 w-8" />
                                            <p className="font-semibold">Click to upload image</p>
                                            <p className="text-xs">PNG, JPG, GIF up to 10MB</p>
                                        </div>
                                    )}
                                </div>
                                 <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*"
                                    disabled={isUploading}
                                />
                                {errors.featuredImage && <p className="text-xs text-destructive mt-1">{errors.featuredImage.message}</p>}
                                <Input 
                                    {...register('featuredImage')}
                                    placeholder="Or paste an image URL here"
                                    className="mt-2"
                                    readOnly={isUploading}
                                />
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
                    </div>
                    
                    <Separator />

                    <div>
                        <h3 className="text-lg font-medium mb-2">Frequently Asked Questions</h3>
                         <div className="space-y-4 p-4 border rounded-lg">
                            {fields.map((field, index) => (
                                <div key={field.id} className="p-4 border rounded-md relative space-y-2">
                                     <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 h-6 w-6 text-destructive"
                                        onClick={() => remove(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <div className="space-y-1">
                                        <Label htmlFor={`faqs.${index}.question`}>Question</Label>
                                        <Input
                                            id={`faqs.${index}.question`}
                                            {...register(`faqs.${index}.question`)}
                                        />
                                        {errors.faqs?.[index]?.question && (
                                            <p className="text-xs text-destructive">{errors.faqs[index]?.question?.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor={`faqs.${index}.answer`}>Answer</Label>
                                        <Textarea
                                            id={`faqs.${index}.answer`}
                                            {...register(`faqs.${index}.answer`)}
                                            rows={3}
                                        />
                                         {errors.faqs?.[index]?.answer && (
                                            <p className="text-xs text-destructive">{errors.faqs[index]?.answer?.message}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => append({ question: '', answer: '' })}
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add FAQ
                            </Button>
                         </div>
                    </div>
                </div>
            </ScrollArea>

            <DialogFooter className="mt-4 pt-4 border-t">
                <DialogClose asChild>
                    <Button type="button" variant="outline">
                    Cancel
                    </Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting || isUploading}>
                {isSubmitting ? 'Saving...' : 'Save Post'}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
