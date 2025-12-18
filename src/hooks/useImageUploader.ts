
'use client';

import { useState, useCallback } from 'react';
import { useStorage } from '@/firebase';
import { ref, uploadBytesResumable, getDownloadURL, UploadTask } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';

export type UploadableFile = {
    file: File;
    id: string;
    progress: number;
    url?: string;
    error?: string;
    task?: UploadTask;
};

export function useImageUploader(uploadPath: string) {
    const storage = useStorage();
    const { toast } = useToast();
    const [files, setFiles] = useState<UploadableFile[]>([]);

    const uploadFile = useCallback(async (file: File, onUrlReady: (url: string, file: File) => void) => {
        const fileId = `${file.name}-${Date.now()}`;
        
        // Client-side validation
        const acceptedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!acceptedFileTypes.includes(file.type)) {
            toast({ variant: 'destructive', title: 'Invalid File Type', description: `File "${file.name}" is not supported.` });
            return;
        }

        const maxFileSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxFileSize) {
            toast({ variant: 'destructive', title: 'File Too Large', description: `File "${file.name}" exceeds the 10MB limit.` });
            return;
        }

        const storageRef = ref(storage, `${uploadPath}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        const newFile: UploadableFile = { file, id: fileId, progress: 0, task: uploadTask };
        setFiles(prev => [...prev, newFile]);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setFiles(prev => prev.map(f => f.id === fileId ? { ...f, progress } : f));
            },
            (error) => {
                console.error("Upload failed:", error);
                setFiles(prev => prev.map(f => f.id === fileId ? { ...f, error: 'Upload failed' } : f));
                toast({ variant: 'destructive', title: 'Upload Failed', description: `Could not upload ${file.name}. Please try again.` });
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, url: downloadURL, progress: 100 } : f));
                    onUrlReady(downloadURL, file);
                });
            }
        );

    }, [storage, uploadPath, toast]);

    const uploadMultipleFiles = useCallback((fileList: FileList, onUrlReady: (url: string, file: File) => void) => {
        if (!fileList || fileList.length === 0) return;
        for (let i = 0; i < fileList.length; i++) {
            uploadFile(fileList[i], onUrlReady);
        }
    }, [uploadFile]);

    const removeFile = (id: string) => {
        setFiles(prev => {
            const fileToRemove = prev.find(f => f.id === id);
            if (fileToRemove?.task && fileToRemove.task.snapshot.state === 'running') {
                fileToRemove.task.cancel();
            }
            return prev.filter(f => f.id !== id);
        });
    };

    return {
        uploadFiles: uploadMultipleFiles,
        files,
        removeFile,
    };
}
