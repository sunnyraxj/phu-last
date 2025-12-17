
'use client';

import { useState, useCallback } from 'react';
import { useStorage } from '@/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export type UploadableFile = {
    file: File;
    id: string;
    progress: number;
    url?: string;
    error?: string;
};

// This hook is not currently used but is kept for potential future use.
// The image upload functionality has been simplified to use URLs directly.
export function useImageUploader(uploadPath: string) {
    const storage = useStorage();
    const [files, setFiles] = useState<UploadableFile[]>([]);

    const uploadFile = useCallback(async (file: File, onUrlReady: (url: string, file: File) => void) => {
        const fileId = `${file.name}-${Date.now()}`;
        
        // Add to state for immediate feedback
        const newFile: UploadableFile = { file, id: fileId, progress: 0 };
        setFiles(prev => [...prev, newFile]);

        try {
            const storageRef = ref(storage, `${uploadPath}/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, progress } : f));
                },
                (error) => {
                    console.error("Upload failed:", error);
                    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, error: 'Upload failed' } : f));
                },
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, url: downloadURL, progress: 100 } : f));
                        onUrlReady(downloadURL, file);
                    });
                }
            );
        } catch (error) {
            console.error("Image processing failed:", error);
            setFiles(prev => prev.map(f => f.id === fileId ? { ...f, error: 'Image processing failed' } : f));
        }
    }, [storage, uploadPath]);

    const uploadMultipleFiles = useCallback((fileList: FileList, onUrlReady: (url: string, file: File) => void) => {
        if (!fileList || fileList.length === 0) return;
        for (let i = 0; i < fileList.length; i++) {
            uploadFile(fileList[i], onUrlReady);
        }
    }, [uploadFile]);

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    return {
        uploadFiles: uploadMultipleFiles,
        files,
        removeFile,
    };
}

    