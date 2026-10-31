import { LoginForm } from "@/features/auth/components/LoginForm";
import { AuthShell } from "@/features/auth/components/AuthShell";

export default function LoginPage() {
  return (
    <AuthShell
      footer={<>Your session stays on this device. Logging out clears everything.</>}
    >
      <LoginForm />
    </AuthShell>
  );
}
