import Link from "next/link";
import Logo from "@/components/Logo";
import WaitlistForm from "@/components/WaitlistForm";
import { APP_CITY, APP_NAME } from "@/lib/brand";

export default function WaitlistPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-6 py-6 sm:px-10 sm:py-8 flex items-center justify-between gap-4">
        <Logo size="md" />
        <Link
          href="/"
          className="text-base text-muted hover:text-navy transition-colors"
        >
          Back
        </Link>
      </header>

      <div className="flex-1 px-6 pb-16 sm:px-10 lg:px-16 max-w-xl w-full mx-auto">
        <h1 className="text-3xl sm:text-4xl text-navy leading-tight mb-3">
          Join the {APP_NAME} waitlist
        </h1>
        <p className="text-lg leading-relaxed text-muted mb-10">
          Early access for startup people in {APP_CITY}. We&apos;ll email when
          the live map opens.
        </p>

        <WaitlistForm />

        <p className="mt-10 text-base text-muted leading-relaxed">
          Want to see the product first?{" "}
          <Link
            href="/demo"
            className="text-navy font-medium underline underline-offset-2 hover:text-accent"
          >
            Try the full demo
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
