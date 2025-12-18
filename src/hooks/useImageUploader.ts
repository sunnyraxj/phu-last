
'use client';

import { useState, useCallback } from 'react';
import { useStorage } from '@/firebase';
import { ref, uploadBytesResumable, getDownloadURL, StorageError } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';

/**
 * A streamlined hook for handling single image uploads to Firebase Storage.
 * @param uploadPath - The path in your Firebase Storage bucket where files will be uploaded (e.g., 'product-images').
 * @returns An object with upload state and control functions.
 */
export function useImageUploader(uploadPath: string) {
    const storage = useStorage();
    const { toast } = useToast();
    
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const uploadFile = useCallback((file: File) => {
        if (!storage) {
            const err = "Firebase Storage is not available. Please try again later.";
            setError(err);
            toast({ variant: 'destructive', title: 'Storage Error', description: err });
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setUploadedUrl(null);
        setError(null);

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

        const storageRef = ref(storage, `${uploadPath}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (uploadError: StorageError) => {
                console.error("Upload failed:", uploadError);
                let errMessage = `Could not upload ${file.name}. Please try again.`;

                if (uploadError.code === 'storage/unauthorized') {
                    errMessage = "You do not have permission to upload files. Please check storage rules.";
                } else if (uploadError.code === 'storage/canceled') {
                    errMessage = "The upload was canceled.";
                }

                setError(errMessage);
                setIsUploading(false);
                toast({ variant: 'destructive', title: 'Upload Failed', description: errMessage });
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    setUploadedUrl(downloadURL);
                    setIsUploading(false);
                    toast({ title: 'Upload Complete', description: `${file.name} has been uploaded.`});
                } catch (urlError) {
                    console.error("Failed to get download URL:", urlError);
                    const err = "Upload succeeded, but could not get the image URL.";
                    setError(err);
                    setIsUploading(false);
                    toast({ variant: 'destructive', title: 'Error', description: err });
                }
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
