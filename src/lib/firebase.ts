import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  collection, 
  doc, 
  getDocFromServer,
  FirestoreError
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Debug logging for config (redacted)
console.log("Firebase context:", {
  hasConfig: !!firebaseConfig,
  projectId: firebaseConfig?.projectId,
  databaseId: firebaseConfig?.firestoreDatabaseId
});

const app = initializeApp(firebaseConfig);

// Use initializeFirestore with long polling for better reliability in this environment
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId || '(default)');

export const auth = getAuth(app);

// Authentication readiness state
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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
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

// CRITICAL: Connection test
async function testConnection() {
  try {
    console.log("Testing Firestore connection with database:", firebaseConfig.firestoreDatabaseId);
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection test completed (ignoring potential permission errors)");
  } catch (error) {
    if (error instanceof Error) {
      console.error("Firestore connection test error:", error.message);
      if (error.message.includes('the client is offline') || error.message.includes('unavailable')) {
        console.error("Please check your Firebase configuration. The client appears to be offline or unreachable.");
      }
    }
  }
}
testConnection();
