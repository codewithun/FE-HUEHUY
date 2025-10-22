import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../helpers/firebase";

const provider = new GoogleAuthProvider();

/**
 * Initiates Google Sign-In via Firebase and POSTs the ID token to backend.
 * Returns parsed JSON response from backend or throws on HTTP error.
 */
export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();

  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  if (!apiBase) throw new Error("NEXT_PUBLIC_API_URL is not set");

  const res = await fetch(`${apiBase}/auth/login-firebase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || "Login gagal";
    throw new Error(message);
  }
  return data;
}
