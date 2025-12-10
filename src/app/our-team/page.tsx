
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const teamMembers = [
  {
    name: 'Anjali Sharma',
    role: 'Lead Artisan',
    image: 'https://picsum.photos/seed/team1/400/400',
    'data-ai-hint': 'woman portrait',
    bio: 'Anjali is the heart of our artisan team, with over 20 years of experience in traditional crafts. Her passion for preserving heritage techniques inspires everyone.'
  },
  {
    name: 'Rohan Verma',
    role: 'Product Designer',
    image: 'https://picsum.photos/seed/team2/400/400',
    'data-ai-hint': 'man portrait',
    bio: 'Rohan bridges the gap between traditional art and modern aesthetics. He works closely with artisans to create products that are both beautiful and functional.'
  },
  {
    name: 'Priya Singh',
    role: 'Operations Head',
    image: 'https://picsum.photos/seed/team3/400/400',
    'data-ai-hint': 'woman smiling',
    bio: 'Priya ensures that everything runs smoothly, from sourcing sustainable materials to delivering the final product to your doorstep with care.'
  },
];

export default function OurTeamPage() {
  return (
    <div className="bg-background">
      <header className="bg-black text-white">
        <div className="container mx-auto flex items-center justify-between px-8 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold">P</span>
            </div>
            <span className="text-lg font-semibold">Purbanchal Hasta Udyog</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Meet Our Team</h1>
          <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
            The passionate individuals dedicated to bringing you the finest handcrafted goods.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {teamMembers.map((member) => (
            <div key={member.name} className="text-center">
              <div className="relative h-64 w-64 mx-auto rounded-full overflow-hidden mb-4 shadow-lg">
                <Image
                  src={member.image}
                  alt={member.name}
                  width={400}
                  height={400}
                  className="object-cover"
                  data-ai-hint={member['data-ai-hint']}
                />
              </div>
              <h2 className="text-2xl font-semibold text-foreground">{member.name}</h2>
              <p className="text-primary font-medium">{member.role}</p>
              <p className="mt-2 text-muted-foreground max-w-xs mx-auto">{member.bio}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link href="/">
            <Button size="lg">Back to Shopping</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
