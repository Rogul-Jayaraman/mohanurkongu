import { useState, useEffect, useRef } from 'react';

export function usePreviewUrl(file: File | null) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const currentFileRef = useRef<File | null>(null);

  useEffect(() => {
    if (file) {
      if (currentFileRef.current) {
        URL.revokeObjectURL(previewUrl || '');
      }
      const url = URL.createObjectURL(file);
      currentFileRef.current = file;
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        currentFileRef.current = null;
      };
    }
    setPreviewUrl(null);
    currentFileRef.current = null;
  }, [file]);

  return previewUrl;
}
