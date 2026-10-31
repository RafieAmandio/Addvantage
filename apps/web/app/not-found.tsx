import { StatusScreen } from "@/features/auth/components/StatusScreen";

export default function NotFound() {
  return (
    <StatusScreen
      page
      code="404"
      eyebrow="Not found"
      title="This page does not exist"
      body="The link may be wrong, or the page has been moved or removed."
      actions={[
        { label: "Go to dashboard", href: "/app", primary: true },
        { label: "Home", href: "/" },
      ]}
    />
  );
}
