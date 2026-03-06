/**
 * setAdmin.ts – One-shot script to promote a Firebase user to admin.
 *
 * Usage (from the backend/ folder):
 *   npx ts-node src/scripts/setAdmin.ts user@example.com
 */

import admin from 'firebase-admin';
import config from '../config';

const email = process.argv[2];

if (!email) {
    console.error('❌  Usage: npx ts-node src/scripts/setAdmin.ts <email>');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey?.replace(/\\n/g, '\n'),
    }),
});

(async () => {
    try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().setCustomUserClaims(user.uid, { admin: true });
        console.log(`✅  Admin claim set on ${email} (uid: ${user.uid})`);
        console.log('   The user must sign out and sign back in for the claim to take effect.');
    } catch (err: any) {
        console.error('❌  Error:', err.message);
        process.exit(1);
    }
})();
