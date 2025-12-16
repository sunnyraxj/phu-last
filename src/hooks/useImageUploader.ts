
'use client';

import { useState } from 'react';
import { useStorage } from '@/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export function useImageUploader(uploadPath: string) {
  const storage = useStorage();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setUploadedUrl(null);

    const storageRef = ref(storage, `${uploadPath}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (uploadError) => {
        console.error("Upload failed:", uploadError);
        setError('Image upload failed. Please try again.');
        setIsUploading(false);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setUploadedUrl(downloadURL);
          setIsUploading(false);
        });
      }
    );
  };

  const clearUpload = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadedUrl(null);
    setError(null);
  };

  return {
    uploadFile,
    isUploading,
    uploadProgress,
    uploadedUrl,
    setUploadedUrl,
    error,
    clearUpload
  };
}
