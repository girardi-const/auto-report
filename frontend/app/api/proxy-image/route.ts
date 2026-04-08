import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function GET(request: NextRequest) {
    const rawUrl = request.nextUrl.searchParams.get('url');

    if (!rawUrl) {
        return new NextResponse('Missing url parameter', { status: 400 });
    }

    try {
        // Fix double slashes in the path (e.g., domain.com/upload//thumbs -> domain.com/upload/thumbs)
        // This safely ignores the "://" in the protocol
        const cleanedUrl = rawUrl.replace(/([^:]\/)\/+/g, "$1");

        let imageUrl = cleanedUrl;

        // Cloudinary specific optimization: request PNG directly if it's an uploaded image
        // and NOT already a standard web format. Cloudinary supports on-the-fly format 
        // conversion by extension, but large images might fail to convert to PNG on their end
        // due to size limits (e.g. 10MB/25MB). 
        // We only do this for potentially unsupported formats like JP2 to let Cloudinary handle them.
        const isStandardFormat = /\.(jpe?g|png|webp|gif|avif)$/i.test(imageUrl.split('?')[0]);
        if (imageUrl.includes('res.cloudinary.com') && imageUrl.includes('/upload/') && !isStandardFormat) {
            // Remove existing extension and replace with .png (or append it)
            // Example: .../image/upload/v123/img.jp2 -> .../image/upload/v123/img.png
            const hasExtension = /\.[a-z0-9]+(?=\?|$)/i.test(imageUrl);
            if (hasExtension) {
                imageUrl = imageUrl.replace(/\.[a-z0-9]+(?=\?|$)/i, '.png');
            } else if (!imageUrl.includes('?')) {
                imageUrl += '.png';
            }
        }

        const getBuffer = (urlString: string, redirectCount = 0): Promise<Buffer> => {
            if (redirectCount > 5) return Promise.reject(new Error('Too many redirects'));
            return new Promise((resolve, reject) => {
                const parsedUrl = new URL(urlString);
                const protocol = parsedUrl.protocol === 'https:' ? require('https') : require('http');

                protocol.get(urlString, {
                    rejectUnauthorized: false,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Referer': `${parsedUrl.origin}/`,
                        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                    }
                }, (res: any) => {
                    if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                        let redirectUrl = res.headers.location;
                        if (!redirectUrl.startsWith('http')) {
                            redirectUrl = new URL(redirectUrl, urlString).toString();
                        }
                        return resolve(getBuffer(redirectUrl, redirectCount + 1));
                    }
                    if (res.statusCode && res.statusCode >= 400) {
                        // Attach the status code to the error object so we can read it in the catch block
                        const error: any = new Error(`Failed to fetch image: ${res.statusCode} at URL: ${urlString}`);
                        error.status = res.statusCode;
                        return reject(error);
                    }
                    const data: Buffer[] = [];
                    res.on('data', (chunk: Buffer) => data.push(chunk));
                    res.on('end', () => resolve(Buffer.concat(data)));
                    res.on('error', reject);
                }).on('error', reject);
            });
        };

        const buffer = await getBuffer(imageUrl);

        let pngBuffer: Buffer;
        try {
            // Convert to PNG using sharp to ensure compatibility with react-pdf
            pngBuffer = await sharp(buffer).png().toBuffer();
        } catch (sharpError: any) {
            console.error('Sharp conversion failed for buffer from:', imageUrl, 'Error:', sharpError.message);
            // If it's a Cloudinary URL and Sharp failed but it may be a valid image already,
            // we could try to return it directly, but for react-pdf we really want PNG.
            // For now, rethrow to trigger the 500 block with better logging.
            throw sharpError;
        }

        return new NextResponse(pngBuffer as any, {
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=86400, immutable',
            },
        });
    } catch (error: any) {
        console.error('Error proxying image from URL:', rawUrl, 'Error:', error.message || error);

        // Return a specific 404 response if the target server couldn't find the image
        if (error.status === 404) {
            return new NextResponse('Image not found on target server', { status: 404 });
        }

        // Pass through other specific status codes if they exist, otherwise default to 500
        const statusCode = error.status || 500;
        return new NextResponse('Error fetching or converting image', { status: statusCode });
    }
}