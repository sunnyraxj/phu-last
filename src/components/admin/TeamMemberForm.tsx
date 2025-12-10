'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
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

const teamMemberSchema = z.object({
  name: z.string().min(1, { message: 'Member name is required' }),
  role: z.string().min(1, { message: 'Role is required' }),
  bio: z.string().min(1, { message: 'Bio is required' }),
  image: z.string().url({ message: 'Please enter a valid image URL' }),
});

type TeamMemberFormValues = z.infer<typeof teamMemberSchema>;

interface TeamMemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TeamMemberFormValues) => void;
  member: TeamMemberFormValues & { id?: string } | null;
}

export function TeamMemberForm({ isOpen, onClose, onSubmit, member }: TeamMemberFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      name: '',
      role: '',
      bio: '',
      image: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (member) {
          reset(member);
        } else {
          reset({
            name: '',
            role: '',
            bio: '',
            image: '',
          });
        }
    }
  }, [member, reset, isOpen]);

  const handleFormSubmit: SubmitHandler<TeamMemberFormValues> = (data) => {
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{member ? 'Edit Team Member' : 'Add New Team Member'}</DialogTitle>
          <DialogDescription>
            {member ? "Update this team member's details." : "Fill out the form to add a new member to the team."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
            <ScrollArea className="h-96 pr-6 -mr-6">
                <div className="space-y-4 my-4">
                    <div className="space-y-1">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" {...register('name')} />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="role">Role</Label>
                        <Input id="role" {...register('role')} />
                        {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="bio">Biography</Label>
                        <Textarea id="bio" {...register('bio')} rows={4} />
                        {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="image">Image URL</Label>
                        <Input id="image" {...register('image')} placeholder="https://picsum.photos/seed/..." />
                        {errors.image && <p className="text-xs text-destructive">{errors.image.message}</p>}
                    </div>
                </div>
            </ScrollArea>

            <DialogFooter className="mt-4">
                <DialogClose asChild>
                    <Button type="button" variant="outline">
                    Cancel
                    </Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Member'}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
