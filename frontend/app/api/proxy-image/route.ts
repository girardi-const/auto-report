import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing url parameter', { status: 400 });
    }

    try {
        const parsed = new URL(url);
        
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
                        return reject(new Error(`Failed to fetch image: ${res.statusCode}`));
                    }
                    const data: Buffer[] = [];
                    res.on('data', (chunk: Buffer) => data.push(chunk));
                    res.on('end', () => resolve(Buffer.concat(data)));
                    res.on('error', reject);
                }).on('error', reject);
            });
        };

        const buffer = await getBuffer(url);
        
        // Convert to PNG using sharp to ensure compatibility with react-pdf
        const pngBuffer = await sharp(buffer).png().toBuffer();

        return new NextResponse(pngBuffer as any, {
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=86400, immutable',
            },
        });
    } catch (error) {
        console.error('Error proxying image:', error);
        return new NextResponse('Error fetching or converting image', { status: 500 });
    }
}
