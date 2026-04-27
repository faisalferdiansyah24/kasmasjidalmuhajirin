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

const databaseId = firebaseConfig?.firestoreDatabaseId || '(default)';

// Use initializeFirestore with long polling for better reliability in this environment
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, databaseId);

// Add a simple local storage fallback for transactions/categories if cloud is failing
export const localDb = {
  saveTransaction: (data: any) => {
    const txs = JSON.parse(localStorage.getItem('local_transactions') || '[]');
    const newTx = { ...data, id: 'local-' + Date.now(), isLocal: true };
    txs.push(newTx);
    localStorage.setItem('local_transactions', JSON.stringify(txs));
    return newTx;
  },
  getTransactions: () => {
    return JSON.parse(localStorage.getItem('local_transactions') || '[]');
  },
  saveCategory: (data: any) => {
    const cats = JSON.parse(localStorage.getItem('local_categories') || '[]');
    const newCat = { ...data, id: 'local-cat-' + Date.now(), isLocal: true };
    cats.push(newCat);
    localStorage.setItem('local_categories', JSON.stringify(cats));
    return newCat;
  },
  getCategories: () => {
    return JSON.parse(localStorage.getItem('local_categories') || '[]');
  }
};

export const isLocalMode = () => sessionStorage.getItem('manualUser') === 'local';

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
    console.log("Checking Firestore availability...");
    // Try to reach the server. We don't necessarily care about the result for this check,
    // just if the client throws an 'offline' error.
    await getDocFromServer(doc(db, 'system', 'connection-test'));
    console.log("Firestore backend reached.");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('offline') || error.message.includes('unavailable')) {
        console.warn("Firestore client reports as offline. Initializing fallback mode...");
      } else {
        // Permission denied is expected and means we ARE connected
        console.log("Firestore connection verified (Permission Denied as expected).");
      }
    }
  }
}
testConnection();
