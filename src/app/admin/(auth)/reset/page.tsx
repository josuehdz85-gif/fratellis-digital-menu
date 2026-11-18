import { AuthForm, AuthShell } from "@/components/admin/AuthForms";
import { resetPasswordAction } from "../../actions";

export const metadata = { title: "New password" };

export default function ResetPage() {
  return (
    <AuthShell title="Choose a new password">
      <AuthForm
        action={resetPasswordAction}
        submit="Save password"
        fields={[{ name: "password", label: "New password (10+ characters)", type: "password", autoComplete: "new-password" }]}
      />
    </AuthShell>
  );
}
