
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import nextConfig from '@/next.config';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidImageDomain(url: string | undefined | null): boolean {
    if (!url) return false;

    // Allow all data URIs for images
    if (url.startsWith('data:image/')) {
        return true;
    }

    try {
        const urlObject = new URL(url);
        // Only proceed with domain checking for http/https protocols
        if (urlObject.protocol !== 'http:' && urlObject.protocol !== 'https:') {
            return false;
        }

        const remotePatterns = nextConfig.images?.remotePatterns || [];
        
        return remotePatterns.some(pattern => {
            const patternHostname = pattern.hostname.replace(/\\\*\\\*/g, '*'); // Handle escaped double wildcards

            if (patternHostname.startsWith('*.')) {
                const mainDomain = patternHostname.substring(2);
                return urlObject.hostname.endsWith(`.${mainDomain}`) || urlObject.hostname === mainDomain;
            }
            if (patternHostname.startsWith('**.')) {
                const mainDomain = patternHostname.substring(3);
                return urlObject.hostname.endsWith(`.${mainDomain}`) || urlObject.hostname === mainDomain;
            }
            if (patternHostname.includes('*')) {
                // More generic wildcard matching
                const regex = new RegExp(`^${patternHostname.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`);
                return regex.test(urlObject.hostname);
            }
            
            // Exact match
            return pattern.hostname === urlObject.hostname;
        });
    } catch (e) {
        // new URL() can throw an error for invalid URLs.
        return false;
    }
}
