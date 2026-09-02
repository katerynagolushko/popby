import Image from "next/image";
import { LANDING_CARD_PHOTOS } from "@/lib/demo-portraits";

type LandingPerson = {
  name: string;
  role: string;
  timeLeft: string;
  formatIntent: string;
  area: string;
  photo: string;
  positionClass: string;
  rotateClass: string;
  delayClass: string;
};

const PEOPLE: LandingPerson[] = [
  {
    name: "Adam",
    role: "Founder",
    timeLeft: "45m left",
    formatIntent: "Coffee · product feedback",
    area: "Near Old Street",
    photo: LANDING_CARD_PHOTOS.Adam,
    positionClass: "top-[8%] left-[6%] sm:left-[8%]",
    rotateClass: "rotate-[-2.5deg]",
    delayClass: "",
  },
  {
    name: "Sara",
    role: "Operator",
    timeLeft: "1h left",
    formatIntent: "Walk · brainstorm",
    area: "Shoreditch",
    photo: LANDING_CARD_PHOTOS.Sara,
    positionClass: "top-[12%] right-[5%] sm:right-[8%]",
    rotateClass: "rotate-[2deg]",
    delayClass: "landing-card-delay-1",
  },
  {
    name: "Maya",
    role: "Investor",
    timeLeft: "30m left",
    formatIntent: "Co-work · casual chat",
    area: "King's Cross",
    photo: LANDING_CARD_PHOTOS.Maya,
    positionClass: "bottom-[22%] left-[4%] sm:left-[10%] hidden sm:block",
    rotateClass: "rotate-[1.5deg]",
    delayClass: "landing-card-delay-2",
  },
  {
    name: "Leo",
    role: "Freelancer",
    timeLeft: "2h left",
    formatIntent: "Activity · just hang",
    area: "London Bridge",
    photo: LANDING_CARD_PHOTOS.Leo,
    positionClass: "bottom-[14%] right-[4%] sm:right-[7%] hidden md:block",
    rotateClass: "rotate-[-1.5deg]",
    delayClass: "landing-card-delay-3",
  },
];

function ProfileCard({ person }: { person: LandingPerson }) {
  return (
    <div
      className={`absolute z-20 w-[min(100%,15.5rem)] pointer-events-none landing-card-in ${person.positionClass} ${person.delayClass}`}
    >
      <div className={`popby-card p-4 text-left shadow-lg ${person.rotateClass}`}>
        <div className="flex items-center gap-3 mb-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={person.photo}
            alt=""
            className="w-10 h-10 rounded-full object-cover bg-paper-2"
          />
          <div className="min-w-0">
            <p className="text-lg font-semibold text-navy truncate">
              {person.name}
            </p>
            <p className="text-lg text-navy/70 truncate">
              {person.role} · {person.timeLeft}
            </p>
          </div>
          <span className="ml-auto live-dot shrink-0" />
        </div>
        <p className="text-lg font-medium text-navy">{person.formatIntent}</p>
        <p className="text-lg text-navy/70 mt-0.5">{person.area}</p>
      </div>
    </div>
  );
}

/** Static London map still — same-origin image for instant LCP (no MapLibre / tiles). */
export default function LandingHeroMap({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-paper-2 ${className}`}>
      <Image
        src="/landing-map.webp"
        alt="London map with people free to hang nearby"
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 60vw"
        className="object-cover object-center"
      />

      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-navy/25 via-transparent to-navy/10" />
      <div className="absolute inset-y-0 left-0 w-16 pointer-events-none bg-gradient-to-r from-paper/40 to-transparent lg:from-transparent" />

      {PEOPLE.map((person) => (
        <ProfileCard key={person.name} person={person} />
      ))}

      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 text-center text-lg text-navy/80 bg-paper/85 backdrop-blur-sm px-4 py-2 rounded-lg max-w-[90%] leading-snug landing-card-in landing-card-delay-3">
        Go live, see who matches nearby, meet in person.
      </p>
    </div>
  );
}
