import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Card } from "@/views/components/shared/Card";
import { Badge } from "@/views/components/shared/Badge";
import { JOB_CATEGORIES } from "@/types";
import {
  formatRelativeTime,
  formatCurrency,
  getDistanceKm,
  formatDistance,
} from "@/lib/utils";
import { MapPin, Clock, Zap, Crown, Lock, Filter } from "lucide-react";
import type { Job } from "@/types";

const RADIUS_OPTIONS = [2, 5, 10, 20] as const;

export default async function JobFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ radius?: string; skills?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: provider } = await supabase
    .from("providers")
    .select("*")
    .eq("id", user.id)
    .single();
  const { data: providerUser } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!provider) redirect("/provider/onboarding");

  const isPremium = provider.subscription_tier === "premium";
  const providerLat = providerUser?.lat;
  const providerLng = providerUser?.lng;
  const hasLocation = providerLat != null && providerLng != null;

  const params = await searchParams;

  const rawRadius = Number(params.radius);
  const radiusKm = RADIUS_OPTIONS.includes(rawRadius as (typeof RADIUS_OPTIONS)[number])
    ? rawRadius
    : 5; // default 5 km

  // skills=on means filter to provider's skills only; default is off (show all)
  const skillsFilter = params.skills === "on";

  // Build query based on tier
  let query = supabase
    .from("jobs")
    .select("*, client:users(id, name, barangay)")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (!isPremium) {
    const now = new Date().toISOString();
    query = query.or(`visible_to_free_at.lte.${now},visible_to_free_at.is.null`);
  }

  const { data: allJobs } = await query;

  // Filter by radius + (optionally) skills
  const jobs = !hasLocation
    ? (allJobs ?? []) // show all if no location (just without distance info)
    : (allJobs ?? []).filter((job: Job) => {
        const dist = getDistanceKm(providerLat!, providerLng!, job.lat, job.lng);
        if (dist > radiusKm) return false;
        if (
          skillsFilter &&
          provider.skills?.length > 0 &&
          !provider.skills.includes(job.category)
        )
          return false;
        return true;
      });

  // Minutes until a job becomes visible to free tier
  const minutesUntilVisible = (job: Job) => {
    if (!job.visible_to_free_at) return 0;
    const visible = new Date(job.visible_to_free_at).getTime();
    return Math.max(0, Math.ceil((visible - Date.now()) / 60000));
  };

  // Toggle URLs
  const skillsToggleHref = skillsFilter
    ? `?radius=${radiusKm}` // turn off skills filter
    : `?radius=${radiusKm}&skills=on`; // turn on skills filter

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-xl font-bold text-slate-900">Job Feed</h1>
        <p className="text-sm text-slate-500">
          {isPremium
            ? "⚡ Premium — instant access to all new jobs"
            : "🆓 Free tier — jobs visible after 5-min delay"}
        </p>
      </div>

      {/* Premium banner for free tier */}
      {!isPremium && (
        <Link href="/provider/subscription">
          <Card
            className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"
            hover
          >
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-amber-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 text-sm">
                  Get Premium — ₱99/mo
                </p>
                <p className="text-xs text-slate-600">
                  See jobs the moment they&apos;re posted. Beat free-tier
                  providers by 4 minutes.
                </p>
              </div>
            </div>
          </Card>
        </Link>
      )}

      {/* Filters row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Radius */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 shrink-0">Within:</span>
          <div className="flex gap-1">
            {RADIUS_OPTIONS.map((km) => (
              <Link
                key={km}
                href={`?radius=${km}${skillsFilter ? "&skills=on" : ""}`}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  radiusKm === km
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                }`}
              >
                {km} km
              </Link>
            ))}
          </div>
        </div>

        {/* Skills toggle */}
        {provider.skills?.length > 0 && (
          <Link
            href={skillsToggleHref}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              skillsFilter
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
            }`}
          >
            <Filter className="w-3 h-3" />
            My skills only
          </Link>
        )}
      </div>

      {/* Location warning (non-blocking) */}
      {!hasLocation && (
        <Card className="bg-amber-50 border-amber-200">
          <p className="text-sm font-medium text-amber-800">📍 Location not set</p>
          <p className="text-xs text-amber-600 mt-0.5">
            Set your location in your profile to see distance and filter by radius.{" "}
            <Link href="/provider/profile" className="underline font-medium">
              Set location
            </Link>
          </p>
        </Card>
      )}

      {/* Job list */}
      {jobs.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-3xl mb-3">🔍</p>
          <p className="font-medium text-slate-700">No jobs found</p>
          <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
            {skillsFilter
              ? "No jobs matching your skills nearby. Try turning off the skills filter."
              : `No open jobs within ${radiusKm} km. Try a wider radius or check back soon.`}
          </p>
          {skillsFilter && (
            <Link
              href={`?radius=${radiusKm}`}
              className="mt-3 inline-block text-sm font-medium text-indigo-600 underline"
            >
              Show all categories
            </Link>
          )}
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job: Job) => {
            const dist =
              hasLocation
                ? getDistanceKm(providerLat!, providerLng!, job.lat, job.lng)
                : null;
            const meta = JOB_CATEGORIES[job.category];
            const minsLeft = minutesUntilVisible(job);
            const isLocked = !isPremium && minsLeft > 0;

            return (
              <Link
                key={job.id}
                href={
                  isLocked
                    ? "/provider/subscription"
                    : `/provider/job-feed/${job.id}`
                }
              >
                <Card hover className={isLocked ? "opacity-60" : ""}>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl flex-shrink-0 border border-slate-100">
                      {meta?.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-slate-900 leading-tight">
                          {job.title}
                        </p>
                        {isLocked && (
                          <Lock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {job.address_text}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {dist !== null && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="w-3 h-3" />
                            {formatDistance(dist)}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          {job.urgency === "asap" ? (
                            <Zap className="w-3 h-3 text-amber-500" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {job.urgency === "asap" ? "ASAP" : "Scheduled"}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatRelativeTime(job.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                    <div>
                      {job.budget_min || job.budget_max ? (
                        <p className="font-semibold text-slate-900">
                          {job.budget_min && job.budget_max
                            ? `${formatCurrency(job.budget_min)} – ${formatCurrency(job.budget_max)}`
                            : job.budget_min
                              ? `From ${formatCurrency(job.budget_min)}`
                              : `Up to ${formatCurrency(job.budget_max!)}`}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-500">Open to offers</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={
                          meta?.color.includes("blue") ? "info" : "default"
                        }
                      >
                        {meta?.label}
                      </Badge>
                      {isLocked && (
                        <Badge variant="warning">
                          <Clock className="w-3 h-3" /> {minsLeft}m
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
