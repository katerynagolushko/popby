import { notFound } from "next/navigation";
import DemoPersonProfile from "@/components/DemoPersonProfile";
import {
  getDemoPersonById,
  getDemoReviews,
  INITIAL_DEMO_PEOPLE,
} from "@/lib/demo-data";
import { APP_NAME } from "@/lib/brand";

export function generateStaticParams() {
  return INITIAL_DEMO_PEOPLE.map((p) => ({ id: p.profile.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const person = getDemoPersonById(id);
  if (!person) return { title: `Profile · ${APP_NAME}` };
  return {
    title: `${person.profile.first_name} · ${APP_NAME} demo`,
    description: person.profile.bio ?? undefined,
  };
}

export default async function DemoPersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const person = getDemoPersonById(id);
  if (!person) notFound();

  const reviews = getDemoReviews(person);

  return <DemoPersonProfile person={person} reviews={reviews} />;
}
