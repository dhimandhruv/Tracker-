"use server";

// Thin server actions so the header button can be a plain <form>. Auth.js's
// signIn/signOut need to set cookies and redirect, which only the server can do.
import { signIn, signOut } from "@/auth";

export async function signInWithGitHub(): Promise<void> {
  await signIn("github");
}

export async function signOutEverywhere(): Promise<void> {
  // Sends the user back to the app rather than to Auth.js's default page.
  await signOut({ redirectTo: "/" });
}
