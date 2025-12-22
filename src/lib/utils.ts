
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
            if (pattern.hostname.startsWith('**.')) {
                // Handle wildcard subdomains like '**.media-amazon.com'
                const mainDomain = pattern.hostname.substring(3); // e.g., 'media-amazon.com'
                return urlObject.hostname.endsWith(mainDomain);
            }
            if (pattern.hostname.startsWith('*.')) {
                // Handle wildcard like '*.example.com'
                const mainDomain = pattern.hostname.substring(2);
                 return urlObject.hostname.endsWith(`.${mainDomain}`) || urlObject.hostname === mainDomain;
            }
            // Exact match
            return pattern.hostname === urlObject.hostname;
        });
    } catch (e) {
        return false;
    }
}
