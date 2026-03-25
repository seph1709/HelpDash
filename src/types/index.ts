// ============================================================
// mykuya — Shared TypeScript Types
// ============================================================

export type UserRole = "client" | "provider" | "both";
export type JobStatus =
  | "open"
  | "matched"
  | "in_progress"
  | "completed"
  | "disputed"
  | "cancelled";
export type BookingStatus =
  | "pending"
  | "accepted"
  | "en_route"
  | "arrived"
  | "in_progress"
  | "done"
  | "no_show"
  | "disputed"
  | "cancelled";
export type PaymentMethod = "gcash" | "cash";
export type PaymentStatus = "success" | "failed";
export type SubscriptionTier = "free" | "premium";
export type DisputeStatus = "open" | "resolved" | "closed";
export type Urgency = "asap" | "scheduled";

export type JobCategory =
  | "plumbing"
  | "electrical"
  | "laundry"
  | "cleaning"
  | "carpentry"
  | "aircon"
  | "painting"
  | "appliance_repair"
  | "moving"
  | "errands"
  | "tutoring"
  | "other";

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: UserRole;
  barangay: string | null;
  city: string;
  lat: number | null;
  lng: number | null;
  gcash_number: string | null;
  created_at: string;
  last_active: string;
}

export interface Provider {
  id: string;
  bio: string | null;
  video_intro_url: string | null;
  skills: string[];
  service_radius_km: number;
  id_photo_url: string | null;
  id_parsed_name: string | null;
  id_parsed_address: string | null;
  id_verified: boolean;
  rating_avg: number;
  total_jobs: number;
  no_show_count: number;
  is_available: boolean;
  subscription_tier: SubscriptionTier;
  subscription_expires_at: string | null;
  last_seen: string;
  hourly_rate: number | null;
  flat_rate: number | null;
  // joined from users
  user?: User;
}

export interface ProviderWithUser extends Provider {
  user: User;
}

export interface Job {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  category: JobCategory;
  lat: number;
  lng: number;
  address_text: string;
  barangay: string;
  budget_min: number | null;
  budget_max: number | null;
  urgency: Urgency;
  scheduled_at: string | null;
  photos: string[];
  voice_note_url: string | null;
  status: JobStatus;
  created_at: string;
  expires_at: string;
  visible_to_free_at: string;
  // joined
  client?: User;
}

export interface Booking {
  id: string;
  job_id: string;
  provider_id: string;
  client_id: string;
  agreed_price: number | null;
  status: BookingStatus;
  provider_eta_minutes: number | null;
  started_at: string | null;
  completed_at: string | null;
  client_confirmed: boolean;
  auto_confirm_at: string | null;
  created_at: string;
  // joined
  job?: Job;
  provider?: ProviderWithUser;
  client?: User;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  gcash_reference_id: string | null;
  recorded_at: string;
}

export interface Rating {
  id: string;
  booking_id: string;
  from_user_id: string;
  to_user_id: string;
  score: number;
  comment: string | null;
  would_rehire: boolean | null;
  created_at: string;
}

export interface Dispute {
  id: string;
  booking_id: string;
  raised_by_id: string;
  reason: string;
  evidence_photos: string[];
  status: DisputeStatus;
  resolution_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  provider_id: string;
  plan: string;
  amount_paid: number;
  started_at: string;
  expires_at: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
}

// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================================
// Job Category Metadata
// ============================================================

export const JOB_CATEGORIES: Record<
  JobCategory,
  { label: string; icon: string; color: string }
> = {
  plumbing: {
    label: "Plumbing",
    icon: "🔧",
    color: "bg-blue-100 text-blue-700",
  },
  electrical: {
    label: "Electrical",
    icon: "⚡",
    color: "bg-yellow-100 text-yellow-700",
  },
  laundry: { label: "Laundry", icon: "👕", color: "bg-cyan-100 text-cyan-700" },
  cleaning: {
    label: "Cleaning",
    icon: "🧹",
    color: "bg-green-100 text-green-700",
  },
  carpentry: {
    label: "Carpentry",
    icon: "🪚",
    color: "bg-amber-100 text-amber-700",
  },
  aircon: {
    label: "AC / Aircon",
    icon: "❄️",
    color: "bg-sky-100 text-sky-700",
  },
  painting: {
    label: "Painting",
    icon: "🎨",
    color: "bg-pink-100 text-pink-700",
  },
  appliance_repair: {
    label: "Appliance Repair",
    icon: "📺",
    color: "bg-purple-100 text-purple-700",
  },
  moving: {
    label: "Moving / Angkat",
    icon: "📦",
    color: "bg-orange-100 text-orange-700",
  },
  errands: {
    label: "Errands / Padala",
    icon: "🛵",
    color: "bg-lime-100 text-lime-700",
  },
  tutoring: {
    label: "Tutoring",
    icon: "📚",
    color: "bg-indigo-100 text-indigo-700",
  },
  other: { label: "Other", icon: "💼", color: "bg-gray-100 text-gray-700" },
};

export const BARANGAYS_QC = [
  "Bagong Pag-asa",
  "Batasan Hills",
  "Cubao",
  "Diliman",
  "Dona Josefa",
  "Fairview",
  "Holy Spirit",
  "Kamuning",
  "Kristong Hari",
  "Loyola Heights",
  "New Era",
  "Novaliches",
  "Pansol",
  "Payatas",
  "Project 2",
  "Project 3",
  "Project 4",
  "Project 6",
  "Project 7",
  "Project 8",
  "Quezon City Hall",
  "Sacred Heart",
  "San Agustin",
  "San Antonio",
  "San Isidro",
  "San Jose",
  "San Martin de Porres",
  "Tandang Sora",
  "Teachers Village",
  "UP Campus",
  "Vasra",
  "Veterans Village",
  "West Triangle",
  "White Plains",
];
