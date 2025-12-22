
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
            const patternHostname = pattern.hostname.replace(/\\*\\*/g, '*'); // Normalize ** to *
            if (patternHostname.startsWith('*.')) {
                const mainDomain = patternHostname.substring(2);
                return urlObject.hostname.endsWith(`.${mainDomain}`) || urlObject.hostname === mainDomain;
            }
            // Exact match
            return pattern.hostname === urlObject.hostname;
        });
    } catch (e) {
        return false;
    }
}
