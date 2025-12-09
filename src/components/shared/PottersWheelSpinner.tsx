import { cn } from "@/lib/utils";

export function PottersWheelSpinner({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid"
      className={cn("w-16 h-16", className)}
    >
      <g transform="translate(50,50)">
        <g transform="scale(0.7)">
          <animateTransform
            attributeName="transform"
            type="rotate"
            repeatCount="indefinite"
            dur="1s"
            values="0 0 0;360 0 0"
            keyTimes="0;1"
          ></animateTransform>
          <path
            fill="hsl(var(--primary))"
            d="M0-30A30 30 0 1 1-21.213 21.213L0 0Z"
          ></path>
          <path
            fill="hsl(var(--primary) / 0.5)"
            d="M-21.213 21.213A30 30 0 0 1-30 0L0 0Z"
          ></path>
          <path
            fill="hsl(var(--secondary))"
            d="M-30 0A30 30 0 0 1 0-30L0 0Z"
          ></path>
        </g>
      </g>
    </svg>
  );
}
