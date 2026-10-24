import {createAuthClient} from 'better-auth/react';

/**
 * Browser-side auth client. No baseURL: requests go to the same origin
 * (`/api/auth/*`), so cookies stay first-party in dev, sandbox preview and
 * production alike.
 */
export const authClient = createAuthClient();
