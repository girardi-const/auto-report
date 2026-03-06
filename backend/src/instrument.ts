// IMPORTANT: This file must be the FIRST import in server.ts.
// Sentry must initialize before any other code runs so it can
// properly instrument Node.js globals, async context, and third-party libraries.
import * as Sentry from '@sentry/node';

const dsn = process.env.SENTRY_DSN;

if (!dsn) {
    console.warn('[Sentry] SENTRY_DSN not set — skipping initialization');
} else {
    Sentry.init({
        dsn,
        sendDefaultPii: true,
    });
}

// Re-export Sentry so other files can use it without installing the package again
export { Sentry };
