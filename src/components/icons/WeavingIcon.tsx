import { cn } from "@/lib/utils";

export function WeavingIcon({ className }: { className?: string }) {
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
            className={cn("lucide lucide-webhook", className)}
        >
            <path d="M18 16.98h-5.45" />
            <path d="M15.03 12.42 12 15.45l-3.03-3.03" />
            <path d="M12 15.45V22" />
            <path d="M18 4.98h-5.45" />
            <path d="M15.03 9.53 12 6.5l-3.03 3.03" />
            <path d="M12 6.5V2" />
            <path d="m9 10-5 5" />
            <path d="m15 10 5 5" />
        </svg>
    )
}
