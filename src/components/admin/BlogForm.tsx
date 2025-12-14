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
import { useEffect, useState } from 'react';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { PlusCircle, Trash2, Wand2, Sparkles, RefreshCw, UploadCloud, X } from 'lucide-react';
import { PottersWheelSpinner } from '../shared/PottersWheelSpinner';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { GenerateBlogPostOutput } from '@/ai/flows/generate-blog-post';
import { useImageUploader } from '@/hooks/useImageUploader';
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';

const faqSchema = z.object({
    question: z.string().min(1, 'Question is required'),
    answer: z.string().min(1, 'Answer is required'),
});

const blogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase and contain only letters, numbers, and hyphens'),
  content: z.string().min(1, 'Content is required'),
  featuredImage: z.string().url('A valid image URL is required.'),
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiNotes, setAiNotes] = useState('');
  const { toast } = useToast();
  
   const {
    uploadFile,
    isUploading,
    uploadProgress,
    uploadedUrl,
    setUploadedUrl,
    error: uploadError,
    clearUpload
  } = useImageUploader('blog_images');

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    getValues,
    setError,
    clearErrors,
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

  const { fields, append, remove, replace } = useFieldArray({
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
        setAiNotes('');
        clearUpload();
    }
  }, [post, reset, isOpen, clearUpload]);

  useEffect(() => {
    if (uploadedUrl) {
      setValue('featuredImage', uploadedUrl, { shouldValidate: true });
      clearErrors('featuredImage');
    }
  }, [uploadedUrl, setValue, clearErrors]);


  const generateSlug = () => {
      const currentTitle = getValues('title');
      if (currentTitle) {
        const slug = currentTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        setValue('slug', slug, { shouldValidate: true });
      }
  };

  const handleGenerateContent = async () => {
    const imageDataUri = getValues('featuredImage');
    if (!imageDataUri) {
      setError('featuredImage', { type: 'manual', message: 'An image is required for AI generation.' });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-blog-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageDataUri,
          userNotes: aiNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content.');
      }

      const result: GenerateBlogPostOutput = await response.json();

      setValue('title', result.title, { shouldValidate: true });
      setValue('slug', result.slug, { shouldValidate: true });
      setValue('content', result.content, { shouldValidate: true });
      if (result.faqs) {
        replace(result.faqs);
      } else {
        replace([]);
      }


      toast({
        title: 'Content Generated!',
        description: 'Title, slug, content, and FAQs have been populated.',
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: error.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };


  const handleFormSubmit: SubmitHandler<BlogFormValues> = (data) => {
    if (!data.featuredImage) {
      setError('featuredImage', { type: 'manual', message: 'A featured image is required.' });
      return;
    }
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
                    
                    <div className="p-4 rounded-lg bg-muted/50 border border-dashed space-y-4">
                        <Label className="flex items-center gap-2 font-semibold">
                            <Sparkles className="h-5 w-5 text-primary" />
                            AI Content Generation
                        </Label>
                        
                        <ImageUploader
                          imageUrl={imageValue}
                          isUploading={isUploading}
                          uploadProgress={uploadProgress}
                          onFileUpload={uploadFile}
                          onUrlChange={(url) => setValue('featuredImage', url, { shouldValidate: true })}
                          onClear={() => {
                            clearUpload();
                            setValue('featuredImage', '', { shouldValidate: true });
                          }}
                          error={errors.featuredImage?.message || uploadError}
                        />

                        <div className="space-y-1">
                            <Label htmlFor="ai-notes">AI Notes (Optional)</Label>
                            <Textarea 
                                id="ai-notes"
                                placeholder="e.g., 'A blog post about traditional bamboo weaving techniques'."
                                value={aiNotes}
                                onChange={(e) => setAiNotes(e.target.value)}
                                rows={2}
                            />
                        </div>
                        <Button 
                            type="button" 
                            onClick={handleGenerateContent} 
                            disabled={isGenerating || !imageValue || isUploading}
                        >
                            {isGenerating ? <PottersWheelSpinner className="h-5 w-5" /> : <Wand2 className="mr-2 h-4 w-4" />}
                            {isGenerating ? 'Generating...' : 'Generate Content & FAQs'}
                        </Button>
                    </div>

                    <Separator />
                    
                    <div>
                        <h3 className="text-lg font-medium mb-2">Blog Details</h3>
                        <div className="space-y-4 p-4 border rounded-lg">
                            <div className="space-y-1">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" {...register('title')} />
                                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="slug">Slug</Label>
                                <div className="flex gap-2">
                                <Input id="slug" {...register('slug')} />
                                 <Button type="button" variant="outline" size="icon" onClick={generateSlug} title="Generate slug from title">
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                                </div>
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
                    </div>
                    
                    <Separator />

                    <div>
                        <h3 className="text-lg font-medium mb-2">Frequently Asked Questions</h3>
                         <div className="space-y-4 p-4 border rounded-lg">
                            {fields.map((field, index) => (
                                <div key={field.id} className="p-4 border rounded-md relative space-y-2 bg-muted/30">
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
                <Button type="submit" disabled={isSubmitting || isGenerating || isUploading}>
                {isSubmitting ? 'Saving...' : 'Save Post'}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Reusable ImageUploader component
interface ImageUploaderProps {
    imageUrl: string;
    isUploading: boolean;
    uploadProgress: number;
    onFileUpload: (file: File) => void;
    onUrlChange: (url: string) => void;
    onClear: () => void;
    error?: string | null;
}

function ImageUploader({
    imageUrl,
    isUploading,
    uploadProgress,
    onFileUpload,
    onUrlChange,
    onClear,
    error
}: ImageUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onFileUpload(file);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file) {
            onFileUpload(file);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    };

    return (
        <div className="space-y-2">
            <Label htmlFor="featuredImage">Featured Image</Label>
            {imageUrl && !isUploading ? (
                <div className="relative h-48 w-full rounded-md overflow-hidden bg-muted">
                    <Image src={imageUrl} alt="Featured image preview" fill className="object-cover" />
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7"
                        onClick={onClear}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : isUploading ? (
                <div className="h-48 w-full rounded-md border border-dashed flex flex-col items-center justify-center p-4">
                    <PottersWheelSpinner />
                    <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
                    <Progress value={uploadProgress} className="w-full mt-2" />
                </div>
            ) : (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={cn(
                        "h-48 w-full rounded-md border-2 border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:border-primary transition-colors",
                        isDragging && "border-primary bg-primary/10"
                    )}
                    onClick={() => document.getElementById('image-upload-input')?.click()}
                >
                    <UploadCloud className="h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                        Drag & drop an image here, or click to select a file
                    </p>
                    <input
                        id="image-upload-input"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>
            )}
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
    );
}