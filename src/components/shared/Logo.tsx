import Image from 'next/image';

export function Logo() {
  return (
    <div className="flex items-center space-x-2">
      <Image src="/logo.png" alt="The Bengali Logo" width={40} height={40} />
      <span className="font-semibold text-lg">The Bengali</span>
    </div>
  );
}
