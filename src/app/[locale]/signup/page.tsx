import {ContactAdminCard} from '@/components/auth/contact-admin-card';

/** Public sign-up is closed — this page is the contact-the-admin card. */
export default function SignupPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <ContactAdminCard />
      </div>
    </main>
  );
}
