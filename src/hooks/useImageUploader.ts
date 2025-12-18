
'use client';

import { useState, useCallback } from 'react';
import { useStorage } from '@/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';

export function useImageUploader(uploadPath: string) {
    const storage = useStorage();
    const { toast } = useToast();
    
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const uploadFile = useCallback((file: File) => {
        // Reset state for new upload
        setIsUploading(true);
        setUploadProgress(0);
        setUploadedUrl(null);
        setError(null);

        // --- Client-side validation ---
        const acceptedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!acceptedFileTypes.includes(file.type)) {
            const err = `File "${file.name}" is not a supported image type.`;
            setError(err);
            setIsUploading(false);
            toast({ variant: 'destructive', title: 'Invalid File Type', description: err });
            return;
        }
        const maxFileSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxFileSize) {
            const err = `File "${file.name}" exceeds the 10MB size limit.`;
            setError(err);
            setIsUploading(false);
            toast({ variant: 'destructive', title: 'File Too Large', description: err });
            return;
        }
        // --- End validation ---

        const storageRef = ref(storage, `${uploadPath}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (uploadError) => {
                console.error("Upload failed:", uploadError);
                const err = `Could not upload ${file.name}. Please try again.`;
                setError(err);
                setIsUploading(false);
                toast({ variant: 'destructive', title: 'Upload Failed', description: err });
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    setUploadedUrl(downloadURL);
                    setIsUploading(false);
                });
            }
        );
    }, [storage, uploadPath, toast]);
    
    const clearUpload = useCallback(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadedUrl(null);
        setError(null);
    }, []);

    return {
        uploadFile,
        isUploading,
        uploadProgress,
        uploadedUrl,
        error,
        clearUpload,
    };
}
