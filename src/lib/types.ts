export type Role =
  | "founder"
  | "operator"
  | "investor"
  | "freelancer"
  | "service_provider";

export type ConnectionStatus = "pending" | "accepted" | "declined";

export type HangoutType =
  | "product_feedback"
  | "cowork"
  | "walk"
  | "coffee"
  | "casual_chat"
  | "brainstorm"
  | "other";

export interface Profile {
  id: string;
  first_name: string;
  photo_url: string | null;
  role: Role;
  bio: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  luma_profile_url: string | null;
  created_at: string;
}

export interface ProfileWithRating extends Profile {
  avg_score: number | null;
  rating_count: number;
}

export interface Availability {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
  hangout_type: HangoutType;
  hangout_note: string | null;
  duration_minutes: 30 | 60 | 120;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  profile?: Profile;
}

export interface Connection {
  id: string;
  from_user_id: string;
  to_user_id: string;
  availability_id: string | null;
  status: ConnectionStatus;
  created_at: string;
  from_profile?: Profile;
  to_profile?: Profile;
}

export interface Message {
  id: string;
  connection_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface UserEvent {
  id: string;
  user_id: string;
  title: string;
  event_url: string | null;
  event_date: string | null;
}

export interface Rating {
  id: string;
  from_user_id: string;
  to_user_id: string;
  connection_id: string;
  score: number;
  comment: string | null;
  created_at: string;
}
