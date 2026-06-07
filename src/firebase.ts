import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);

  // Cleanly identify network / offline status to avoid triggering alarms or crashes
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  const isNetworkOrOfflineError = 
    errMsg.toLowerCase().includes('offline') || 
    errMsg.toLowerCase().includes('fetch') || 
    errMsg.toLowerCase().includes('network') || 
    errMsg.toLowerCase().includes('could not reach') ||
    errMsg.toLowerCase().includes('unavailable') ||
    errMsg.toLowerCase().includes('failed to get document') ||
    errMsg.toLowerCase().includes('client is offline');

  if (isOffline || isNetworkOrOfflineError) {
    console.warn(`[Firestore Offline/Network Status] Operation '${operationType}' on '${path || 'unknown'}' deferred or handled offline: ${errMsg}`);
    return; // Do not log as console.error and do not throw to maintain premium offline-first compatibility
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
