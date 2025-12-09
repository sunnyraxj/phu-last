import { cn } from "@/lib/utils";

export function PotteryIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("lucide lucide-gallery-vertical", className)}
    >
        <path d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8c0 2-1 4-2.5 5.5"/>
        <path d="M10 21h4"/>
        <path d="M4 18h16"/>
        <path d="M14 12a2 2 0 1 0-4 0"/>
    </svg>
  );
}
