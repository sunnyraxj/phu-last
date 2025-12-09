import Image from 'next/image';

export function Logo() {
  return (
    <div className="flex flex-col items-start leading-none">
      <span className="font-bold text-xl tracking-tight">The Bengal Store</span>
      <span className="text-xs tracking-widest text-primary-foreground/80">HANDCRAFTING STORIES</span>
    </div>
  );
}
