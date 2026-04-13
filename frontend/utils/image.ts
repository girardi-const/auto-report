export const getProxyImageUrl = (url?: string | null): string | undefined => {
    if (!url) return undefined;

    if (url.startsWith('/') || url.startsWith('blob:') || url.startsWith('data:')) return url;

    // Proxy all external images through our specific server route
    // This bypasses CORS, fixes TLS issues, converts images to PNG,
    // and satisfies react-pdf's extension checks by adding &ext=.png
    if (url.startsWith('http://') || url.startsWith('https://')) {
        const endpoint = `/api/proxy-image?url=${encodeURIComponent(url)}&ext=.png`;
        return typeof window !== 'undefined' ? `${window.location.origin}${endpoint}` : endpoint;
    }

    return url;
};

/**
 * Compresses an image file to reduce size before uploading.
 * Useful to avoid Vercel's 4.5MB Serverless Function payload size limit.
 */
export const compressImage = async (file: File, maxSizeMB: number = 2): Promise<File> => {
    return new Promise((resolve) => {
        if (!file.type.startsWith('image/')) {
            return resolve(file);
        }

        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size <= maxSizeBytes) {
            return resolve(file);
        }

        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(img.src);
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1920;
            const MAX_HEIGHT = 1080;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height = Math.round(height * (MAX_WIDTH / width));
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width = Math.round(width * (MAX_HEIGHT / height));
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(file);

            // Fill white background for transparent images converted to JPEG
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                if (!blob) return resolve(file);
                const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                });
                // If it's still bigger than maxSize for some reason, at least we reduced dimensions and used JPEG compression.
                resolve(newFile);
            }, 'image/jpeg', 0.8);
        };
        img.onerror = () => resolve(file);
    });
};
