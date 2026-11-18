import { AuthForm, AuthShell, BackToLogin } from "@/components/admin/AuthForms";
import { mfaChallengeAction } from "../../actions";

export const metadata = { title: "Two-step verification" };

export default function MfaPage() {
  return (
    <AuthShell title="Two-step verification">
      <p className="mb-4 text-sm text-ink-soft">Enter the 6-digit code from your authenticator app.</p>
      <AuthForm
        action={mfaChallengeAction}
        submit="Verify"
        fields={[{ name: "code", label: "Code", type: "text", autoComplete: "one-time-code", inputMode: "numeric" }]}
        footer={<BackToLogin />}
      />
    </AuthShell>
  );
}
