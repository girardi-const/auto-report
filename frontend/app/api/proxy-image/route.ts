import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing url parameter', { status: 400 });
    }

    try {
        const parsed = new URL(url);
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': `${parsed.origin}/`,
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            }
        });
        
        if (!response.ok) {
            return new NextResponse(`Failed to fetch image: ${response.status}`, { status: response.status });
        }

        const buffer = await response.arrayBuffer();
        
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
