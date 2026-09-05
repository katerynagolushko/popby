import Link from "next/link";
import Logo, { AppWordmark } from "@/components/Logo";
import WaitlistForm from "@/components/WaitlistForm";
import WaitlistPriorityNote from "@/components/WaitlistPriorityNote";

export default function WaitlistPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-6 py-6 sm:px-10 sm:py-8 flex items-center justify-between gap-4">
        <Logo size="md" />
        <Link
          href="/"
          className="text-lg font-medium text-navy/70 hover:text-navy transition-colors min-h-[52px] inline-flex items-center"
        >
          Back
        </Link>
      </header>

      <div className="flex-1 px-6 pb-16 sm:px-10 lg:px-16 max-w-xl w-full mx-auto">
        <h1 className="text-3xl sm:text-4xl text-navy leading-tight mb-3">
          Join the <AppWordmark /> waitlist*
        </h1>
        <WaitlistPriorityNote className="text-lg leading-relaxed text-navy/70 mb-10" />

        <WaitlistForm />

        <p className="mt-10 text-lg text-navy/70 leading-relaxed">
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
