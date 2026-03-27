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
