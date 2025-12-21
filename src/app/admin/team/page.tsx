
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { TeamMemberForm } from '@/components/admin/TeamMemberForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

type TeamMember = {
    id: string;
    name: string;
    role: 'Founder' | 'Management' | 'Team Member';
    bio: string;
    image: string;
    socialLink?: string;
};

type TeamMemberFormValues = Omit<TeamMember, 'id'>;

export default function TeamPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);
    const [isEditFormOpen, setIsEditFormOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [membersToDelete, setMembersToDelete] = useState<TeamMember[]>([]);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    const teamMembersQuery = useMemoFirebase(() => collection(firestore, 'teamMembers'), [firestore]);
    const { data: teamMembers, isLoading: teamMembersLoading } = useCollection<TeamMember>(teamMembersQuery);
    
    const handleEditClick = (member: TeamMember) => {
        setSelectedMember(member);
        setIsEditFormOpen(true);
    };

    const handleDeleteMembers = async () => {
        if (membersToDelete.length > 0) {
            const batch = writeBatch(firestore);
            membersToDelete.forEach(member => {
                const memberRef = doc(firestore, 'teamMembers', member.id);
                batch.delete(memberRef);
            });
            await batch.commit();
            setMembersToDelete([]);
            setSelectedItems([]);
            toast({
                title: `${membersToDelete.length} member(s) deleted.`,
            });
        }
    };
    
    const handleAddSubmit = (formData: TeamMemberFormValues) => {
        const membersCollection = collection(firestore, "teamMembers");
        addDocumentNonBlocking(membersCollection, formData);
        setIsAddFormOpen(false);
    };
    
    const handleEditSubmit = (formData: TeamMemberFormValues) => {
        if (selectedMember) {
            const memberRef = doc(firestore, "teamMembers", selectedMember.id);
            setDocumentNonBlocking(memberRef, formData, { merge: true });
        }
        setIsEditFormOpen(false);
    };

    const toggleSelection = (itemId: string) => {
        setSelectedItems(prev => 
            prev.includes(itemId) 
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const toggleSelectAll = () => {
        if (teamMembers && selectedItems.length === teamMembers.length) {
            setSelectedItems([]);
        } else if (teamMembers) {
            setSelectedItems(teamMembers.map(item => item.id));
        }
    };
    
    const confirmDelete = () => {
        const toDelete = teamMembers?.filter(item => selectedItems.includes(item.id)) || [];
        setMembersToDelete(toDelete);
    }

    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Our Team</h2>
                <Dialog open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Team Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Team Member</DialogTitle>
                            <DialogDescription>Fill out the form to add a new member to the team.</DialogDescription>
                        </DialogHeader>
                        <TeamMemberForm
                            onSuccess={handleAddSubmit}
                            onCancel={() => setIsAddFormOpen(false)}
                            member={null}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Team Member</DialogTitle>
                        <DialogDescription>Update this team member's details.</DialogDescription>
                    </DialogHeader>
                    <TeamMemberForm
                        onSuccess={handleEditSubmit}
                        onCancel={() => setIsEditFormOpen(false)}
                        member={selectedMember}
                    />
                </DialogContent>
            </Dialog>

            
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>All Team Members</CardTitle>
                    {selectedItems.length > 0 && (
                        <Button variant="destructive" onClick={confirmDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete ({selectedItems.length})
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={teamMembers ? selectedItems.length === teamMembers.length && teamMembers.length > 0 : false}
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead className="w-[80px]">Image</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teamMembersLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <PottersWheelSpinner />
                                        </TableCell>
                                    </TableRow>
                                ) : teamMembers && teamMembers.length > 0 ? (
                                    teamMembers.map((member) => (
                                        <TableRow key={member.id} data-state={selectedItems.includes(member.id) && "selected"}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedItems.includes(member.id)}
                                                    onCheckedChange={() => toggleSelection(member.id)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="relative h-12 w-12 rounded-full overflow-hidden">
                                                    <Image src={member.image} alt={member.name} fill className="object-cover"/>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{member.name}</TableCell>
                                            <TableCell>{member.role}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(member)}>
                                                    <Edit className="h-4 w-4" />
                                                    <span className="sr-only">Edit</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No team members found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={membersToDelete.length > 0} onOpenChange={(isOpen) => !isOpen && setMembersToDelete([])}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete {membersToDelete.length} member(s) from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setMembersToDelete([])}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteMembers} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
