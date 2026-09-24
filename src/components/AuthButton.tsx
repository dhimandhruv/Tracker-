// Header account control. Not part of the original HTML: the single-file app had
// no accounts. Styled only with the existing .btn tokens so it reads as native.
import Image from "next/image";
import { signInWithGitHub, signOutEverywhere } from "@/lib/auth-actions";

export type HeaderUser = { name: string; image: string | null };

export default function AuthButton({ user }: { user: HeaderUser | null }) {
  if (!user) {
    return (
      <form action={signInWithGitHub}>
        <button type="submit" className="btn small">
          Sign in with GitHub to sync
        </button>
      </form>
    );
  }

  return (
    <div className="account">
      {user.image && (
        // next/image needs explicit dimensions; 24px matches the .btn.small line height.
        <Image className="avatar" src={user.image} alt="" width={24} height={24} unoptimized />
      )}
      <span className="account-name">{user.name}</span>
      <form action={signOutEverywhere}>
        <button type="submit" className="btn small ghost">
          Sign out
        </button>
      </form>
    </div>
  );
}
