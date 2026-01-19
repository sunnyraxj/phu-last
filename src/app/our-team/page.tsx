
'use client';

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { PottersWheelSpinner } from "@/components/shared/PottersWheelSpinner";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { Home } from "lucide-react";
import { useMemo } from "react";

type TeamMember = {
    id: string;
    name: string;
    role: 'Founder' | 'Management' | 'Team Member';
    image: string;
    'data-ai-hint'?: string;
    socialLink?: string;
};

export default function OurTeamPage() {
    const { firestore } = useFirebase();
    const teamMembersQuery = useMemoFirebase(() => collection(firestore, 'teamMembers'), [firestore]);
    const { data: teamMembers, isLoading } = useCollection<TeamMember>(teamMembersQuery);

    const { founder, managementMembers, otherTeamMembers } = useMemo(() => {
        if (!teamMembers) return { founder: null, managementMembers: [], otherTeamMembers: [] };
        const founderMember = teamMembers.find(member => member.role === 'Founder');
        const mgmtMembers = teamMembers.filter(member => member.role === 'Management');
        const otherMembers = teamMembers.filter(member => member.role === 'Team Member');
        return { founder: founderMember, managementMembers: mgmtMembers, otherTeamMembers: otherMembers };
    }, [teamMembers]);

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 pt-8">
          <Link href="/">
              <Button variant="outline">
                  <Home className="mr-2 h-4 w-4" /> Home
              </Button>
          </Link>
      </div>

      <main className="container mx-auto pb-8 sm:pb-16 px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Meet Our Team</h1>
          <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto sm:text-xl">
            The passionate individuals dedicated to bringing you the finest handcrafted goods.
          </p>
        </div>

        {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <PottersWheelSpinner />
            </div>
        ) : teamMembers && teamMembers.length > 0 ? (
          <>
            {founder && (
              <div className="mb-12 md:mb-16">
                <div className="flex flex-row items-center justify-center gap-8 md:gap-12 text-center">
                   <div className="relative h-32 w-32 md:h-48 md:w-48 rounded-lg overflow-hidden shadow-2xl group">
                     <Image
                        src={founder.image}
                        alt={founder.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                        data-ai-hint={founder['data-ai-hint']}
                      />
                  </div>
                  <div className="text-left flex-1 max-w-lg">
                    <h3 className="text-2xl font-bold">{founder.name}</h3>
                    <p className="text-sm text-muted-foreground">{founder.role}</p>
                  </div>
                </div>
              </div>
            )}
            
            {managementMembers.length > 0 && (
                <div className="mb-12 md:mb-16">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Management</h2>
                    </div>
                     <Carousel opts={{ align: "start" }} className="w-full">
                      <CarouselContent className="-ml-2 md:-ml-4">
                        {managementMembers.map((member) => (
                          <CarouselItem key={member.id} className="pl-4 md:pl-6 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                              <Card className="w-full max-w-sm overflow-hidden rounded-2xl shadow-lg group">
                                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-2xl">
                                  <Image
                                      src={member.image}
                                      alt={member.name}
                                      fill
                                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                                      data-ai-hint={member['data-ai-hint']}
                                  />
                                </div>
                                <div className="p-3 text-left bg-white">
                                  <h3 className="text-base sm:text-lg font-bold text-slate-900">{member.name}</h3>
                                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 mb-2">{member.role}</p>
                                  {member.socialLink ? (
                                        <Link href={member.socialLink} target="_blank" rel="noopener noreferrer" className="w-full">
                                            <Button size="sm" className="w-full rounded-full h-8 text-xs">Follow +</Button>
                                        </Link>
                                    ) : (
                                        <Button size="sm" className="w-full rounded-full h-8 text-xs" disabled>Follow +</Button>
                                    )}
                                </div>
                              </Card>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                    </Carousel>
                </div>
            )}

            {otherTeamMembers.length > 0 && (
                <div>
                     <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Our Dedicated Team</h2>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
                    {otherTeamMembers.map((member) => (
                        <div key={member.id} className="relative aspect-square rounded-full overflow-hidden group shadow-lg">
                            <Image
                                src={member.image}
                                alt={member.name}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-110"
                                data-ai-hint={member['data-ai-hint']}
                            />
                             <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-center p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                               <div className="text-white">
                                 <h3 className="font-bold text-sm sm:text-base">{member.name}</h3>
                                 <p className="text-xs sm:text-sm opacity-90">{member.role}</p>
                               </div>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
            )}
          </>
        ) : (
            <div className="text-center h-64 flex flex-col items-center justify-center">
                <p className="text-muted-foreground">No team members have been added yet.</p>
            </div>
        )}


        <div className="text-center mt-16">
          <Link href="/">
            <Button size="lg">Back to Shopping</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
