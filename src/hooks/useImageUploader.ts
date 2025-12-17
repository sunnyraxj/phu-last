
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

const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            if (!event.target?.result) {
                return reject(new Error('Could not read file for compression.'));
            }
            img.src = event.target.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            return reject(new Error('Canvas to Blob conversion failed'));
                        }
                        const compressedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    },
                    file.type,
                    0.8 // 80% quality
                );
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

export function useImageUploader(uploadPath: string) {
    const storage = useStorage();
    const [files, setFiles] = useState<UploadableFile[]>([]);

    const uploadFile = useCallback(async (file: File, onUrlReady: (url: string) => void) => {
        const fileId = `${file.name}-${Date.now()}`;
        
        // Add to state for immediate feedback
        setFiles(prev => [...prev, { file, id: fileId, progress: 0 }]);

        try {
            const compressedFile = await compressImage(file);
            const storageRef = ref(storage, `${uploadPath}/${Date.now()}_${compressedFile.name}`);
            const uploadTask = uploadBytesResumable(storageRef, compressedFile);

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
                        onUrlReady(downloadURL);
                    });
                }
            );
        } catch (compressionError) {
            console.error("Image processing failed:", compressionError);
            setFiles(prev => prev.map(f => f.id === fileId ? { ...f, error: 'Image processing failed' } : f));
        }
    }, [storage, uploadPath]);

    const uploadMultipleFiles = useCallback((fileList: FileList, onUrlReady: (url: string) => void) => {
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
