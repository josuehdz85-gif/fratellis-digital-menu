import { AuthForm, AuthShell, BackToLogin } from "@/components/admin/AuthForms";
import { forgotPasswordAction } from "../../actions";

export const metadata = { title: "Reset password" };

export default function ForgotPage() {
  return (
    <AuthShell title="Reset your password">
      <AuthForm
        action={forgotPasswordAction}
        submit="Email me a reset link"
        done="If that email has an account, a reset link is on its way. Check your inbox."
        fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]}
        footer={<BackToLogin />}
      />
    </AuthShell>
  );
}
