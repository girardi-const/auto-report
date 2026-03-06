import admin from 'firebase-admin';
import config from './index';

let firebaseApp: admin.app.App;

export const initializeFirebase = () => {
    if (!firebaseApp) {
        // Initialize with service account credentials
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert({
                projectId: config.firebase.projectId,
                clientEmail: config.firebase.clientEmail,
                privateKey: config.firebase.privateKey?.replace(/\\n/g, '\n'),
            }),
        });
    }
    return firebaseApp;
};

export const getFirebaseAuth = () => {
    if (!firebaseApp) {
        initializeFirebase();
    }
    return admin.auth();
};


