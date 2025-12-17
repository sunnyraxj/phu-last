
'use client';

import { useState } from 'react';
import { useStorage } from '@/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = async (files: FileList, onUrlReady: (url: string) => void) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
            const compressedFile = await compressImage(file);
            
            const storageRef = ref(storage, `${uploadPath}/${Date.now()}_${compressedFile.name}`);
            const uploadTask = uploadBytesResumable(storageRef, compressedFile);

            await new Promise<void>((resolve, reject) => {
                uploadTask.on(
                  'state_changed',
                  (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                  },
                  (uploadError) => {
                    console.error("Upload failed:", uploadError);
                    setError(`Upload failed for ${file.name}. Please try again.`);
                    reject(uploadError);
                  },
                  () => {
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                      onUrlReady(downloadURL);
                      resolve();
                    });
                  }
                );
            });
        } catch(compressionError) {
            console.error("Image processing failed:", compressionError);
            setError(`Could not process ${file.name}. Please try a different file.`);
        }
    }
    
    setIsUploading(false);
    setUploadProgress(0);
  };

  return {
    uploadFiles,
    isUploading,
    uploadProgress,
    error,
  };
}
