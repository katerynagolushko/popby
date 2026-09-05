const LUMA_EVENT_URL = "https://luma.com/km76s0sj";

type WaitlistPriorityNoteProps = {
  className?: string;
};

/** Asterisk footnote: waitlist priority at ecosystem events. */
export default function WaitlistPriorityNote({
  className = "",
}: WaitlistPriorityNoteProps) {
  return (
    <p className={className}>
      * Waitlist users will get priority places at the ecosystem events like this{" "}
      <a
        href={LUMA_EVENT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-accent"
      >
        one
      </a>
    </p>
  );
}
