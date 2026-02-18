'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

/** Initiate anonymous sign-in. Returns a promise to allow awaiting for errors. */
export async function initiateAnonymousSignIn(authInstance: Auth) {
  return signInAnonymously(authInstance);
}

/** Initiate email/password sign-up. Returns a promise to allow awaiting for errors. */
export async function initiateEmailSignUp(authInstance: Auth, email: string, password: string) {
  return createUserWithEmailAndPassword(authInstance, email, password);
}

/** Initiate email/password sign-in. Returns a promise to allow awaiting for errors. */
export async function initiateEmailSignIn(authInstance: Auth, email: string, password: string) {
  return signInWithEmailAndPassword(authInstance, email, password);
}

/** Initiate sign out. Returns a promise. */
export async function initiateSignOut(authInstance: Auth) {
  return signOut(authInstance);
}
