import * as Sentry from '@sentry/node';
import { promises as dns } from 'dns';

// Helper function for DNS resolution with timeout
async function resolveDSNWithTimeout(domain: string, timeoutMs: number = 5000): Promise<string | null> {
    try {
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('DNS resolution timeout')), timeoutMs);
        });
        const txtRecords: string[][] = await Promise.race([dns.resolveTxt(domain), timeoutPromise]);
        if (txtRecords && txtRecords.length > 0 && txtRecords[0].length > 0) {
            const dsn: string = txtRecords[0][0];
            console.log(`DSN resolved from DNS TXT record: ${dsn}`);
            return dsn;
        }
    } catch (error: any) {
        console.error(`DNS resolution failed for domain ${domain}: ${error.message}`);
    }
    return null;
}

// Async Sentry initialization function
export async function initSentryAsync(): Promise<void> {
    let dsn: string | null = process.env.SENTRY_DSN || null;
    if (!dsn) {
        const domain: string = process.env.SENTRY_DSN_DOMAIN || 'sentry-dsn.example.com'; // Configure this domain as needed
        dsn = await resolveDSNWithTimeout(domain, 5000);
    }
    if (dsn) {
        Sentry.init({
            dsn,
            // Add other Sentry options here as needed
        });
        console.log('Sentry initialized successfully with DSN');
    } else {
        // Fallback to regular initialization without DSN
        Sentry.init({
            // No DSN, or add default options
        });
        console.log('Sentry initialized in fallback mode without DSN');
    }
}
