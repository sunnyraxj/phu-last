
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import nextConfig from '@/next.config';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidImageDomain(url: string | undefined | null): boolean {
    if (!url) return false;
    try {
        const urlObject = new URL(url);
        const remotePatterns = nextConfig.images?.remotePatterns || [];
        return remotePatterns.some(pattern => {
            const regex = new RegExp(`^${pattern.hostname?.replace(/\*\*/g, '.+').replace(/\*/g, '[^.]+')}$`);
            return (
                pattern.protocol === urlObject.protocol.slice(0, -1) &&
                regex.test(urlObject.hostname)
            );
        });
    } catch (e) {
        return false;
    }
}
