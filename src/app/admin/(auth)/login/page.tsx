import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm, AuthShell } from "@/components/admin/AuthForms";
import { createOwnerAction, needsOwnerSetup, signInAction } from "../../actions";
import { getSession, localDemoAllowed } from "@/lib/auth";
import { USE_SUPABASE } from "@/lib/config";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getSession()) redirect("/admin");
  if (await needsOwnerSetup()) {
    return (
      <AuthShell title="Create the owner account">
        <p className="mb-4 text-sm text-ink-soft">Nobody has signed up yet. The first account becomes the restaurant owner.</p>
        <AuthForm
          action={createOwnerAction}
          submit="Create owner account"
          fields={[
            { name: "email", label: "Email", type: "email", autoComplete: "email" },
            { name: "password", label: "Password (10+ characters)", type: "password", autoComplete: "new-password" },
          ]}
        />
      </AuthShell>
    );
  }
  return (
    <AuthShell title="Sign in">
      {!USE_SUPABASE ? (
        <p className="mb-4 rounded-lg bg-amber-100 p-3 text-xs text-amber-900">
          {localDemoAllowed()
            ? "Local demo mode (no Supabase keys yet). Use the demo sign-in from .env.example / README."
            : "Supabase is not configured on this deployment."}
        </p>
      ) : null}
      <AuthForm
        action={signInAction}
        submit="Sign in"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
        ]}
        footer={
          <p className="text-center text-sm">
            <Link href="/admin/forgot" className="font-semibold text-pomodoro">Forgot your password?</Link>
          </p>
        }
      />
    </AuthShell>
  );
}
