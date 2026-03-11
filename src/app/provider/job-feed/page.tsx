import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Card } from "@/views/components/shared/Card";
import { Badge } from "@/views/components/shared/Badge";
import { JOB_CATEGORIES } from "@/types";
import { formatRelativeTime, formatCurrency, getDistanceKm, formatDistance } from "@/lib/utils";
import { MapPin, Clock, Zap, Crown, Lock, Filter, Search, Shield } from "lucide-react";
import { CategoryIcon } from "@/lib/category-icons";
import type { Job } from "@/types";

const RADIUS_OPTIONS = [2, 5, 10, 20] as const;

export default async function JobFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ radius?: string; skills?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: provider } = await supabase.from("providers").select("*").eq("id", user.id).single();
  const { data: providerUser } = await supabase.from("users").select("*").eq("id", user.id).single();

  if (!provider) redirect("/provider/onboarding");

  const isPremium = provider.subscription_tier === "premium";
  const providerLat = providerUser?.lat;
  const providerLng = providerUser?.lng;
  const hasLocation = providerLat != null && providerLng != null;

  const params = await searchParams;
  const rawRadius = Number(params.radius);
  const radiusKm = RADIUS_OPTIONS.includes(rawRadius as (typeof RADIUS_OPTIONS)[number]) ? rawRadius : 5;
  const skillsFilter = params.skills === "on";

  let query = supabase.from("jobs").select("*, client:users(id, name, barangay)").eq("status", "open").order("created_at", { ascending: false });
  if (!isPremium) {
    const now = new Date().toISOString();
    query = query.or(`visible_to_free_at.lte.${now},visible_to_free_at.is.null`);
  }
  const { data: allJobs } = await query;

  const jobs = !hasLocation
    ? (allJobs ?? [])
    : (allJobs ?? []).filter((job: Job) => {
        const dist = getDistanceKm(providerLat!, providerLng!, job.lat, job.lng);
        if (dist > radiusKm) return false;
        if (skillsFilter && provider.skills?.length > 0 && !provider.skills.includes(job.category)) return false;
        return true;
      });

  const minutesUntilVisible = (job: Job) => {
    if (!job.visible_to_free_at) return 0;
    return Math.max(0, Math.ceil((new Date(job.visible_to_free_at).getTime() - Date.now()) / 60000));
  };

  const skillsToggleHref = skillsFilter ? `?radius=${radiusKm}` : `?radius=${radiusKm}&skills=on`;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="pt-2">
        <p className="text-xs font-medium text-[#1677ff] mb-0.5">Job Feed</p>
        <h1 className="text-xl font-semibold text-gray-900">Job Feed</h1>
        <p className="flex items-center gap-1.5 text-sm text-gray-400 mt-0.5">
          {isPremium
            ? <><Zap className="w-3.5 h-3.5 text-[#faad14]" /><span>Premium — instant access</span></>
            : <><Shield className="w-3.5 h-3.5 text-gray-400" /><span>Free tier — 5-min delay</span></>}
        </p>
      </div>

      {/* Premium banner */}
      {!isPremium && (
        <Link href="/provider/subscription">
          <div className="rounded-lg border border-[#ffe58f] bg-[#fffbe6] p-3 flex items-center gap-3 hover:border-[#faad14] transition-colors cursor-pointer">
            <Crown className="w-7 h-7 text-[#faad14] flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">Get Premium — ₱99/mo</p>
              <p className="text-xs text-gray-500">See jobs the moment they're posted. Beat free-tier by 4 minutes.</p>
            </div>
          </div>
        </Link>
      )}

      {/* Filters row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400 shrink-0">Within:</span>
          <div className="flex gap-1">
            {RADIUS_OPTIONS.map((km) => (
              <Link
                key={km}
                href={`?radius=${km}${skillsFilter ? "&skills=on" : ""}`}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  radiusKm === km
                    ? "bg-[#1677ff] text-white border-[#1677ff]"
                    : "bg-white text-gray-600 border-[#d9d9d9] hover:border-[#1677ff] hover:text-[#1677ff]"
                }`}
              >
                {km} km
              </Link>
            ))}
          </div>
        </div>
        {provider.skills?.length > 0 && (
          <Link
            href={skillsToggleHref}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium border transition-colors ${
              skillsFilter
                ? "bg-[#1677ff] text-white border-[#1677ff]"
                : "bg-white text-gray-600 border-[#d9d9d9] hover:border-[#1677ff] hover:text-[#1677ff]"
            }`}
          >
            <Filter className="w-3 h-3" />
            My skills only
          </Link>
        )}
      </div>

      {/* Location warning */}
      {!hasLocation && (
        <div className="rounded-lg border border-[#ffe58f] bg-[#fffbe6] p-3">
          <p className="flex items-center gap-1.5 text-sm font-medium text-[#d48806]">
            <MapPin className="w-3.5 h-3.5" /> Location not set
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Set your location in your profile to filter by radius.{" "}
            <Link href="/provider/profile" className="text-[#1677ff] font-medium">Set location</Link>
          </p>
        </div>
      )}

      {/* Job list */}
      {jobs.length === 0 ? (
        <Card className="text-center py-10">
          <Search className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="font-medium text-gray-700">No jobs found</p>
          <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
            {skillsFilter
              ? "No jobs matching your skills nearby. Try turning off the skills filter."
              : `No open jobs within ${radiusKm} km. Try a wider radius or check back soon.`}
          </p>
          {skillsFilter && (
            <Link href={`?radius=${radiusKm}`} className="mt-3 inline-block text-sm font-medium text-[#1677ff]">
              Show all categories
            </Link>
          )}
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job: Job) => {
            const dist = hasLocation ? getDistanceKm(providerLat!, providerLng!, job.lat, job.lng) : null;
            const meta = JOB_CATEGORIES[job.category];
            const minsLeft = minutesUntilVisible(job);
            const isLocked = !isPremium && minsLeft > 0;

            return (
              <Link key={job.id} href={isLocked ? "/provider/subscription" : `/provider/job-feed/${job.id}`}>
                <Card hover className={isLocked ? "opacity-60" : ""}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#e6f4ff] flex items-center justify-center flex-shrink-0">
                      <CategoryIcon category={job.category} className="w-5 h-5 text-[#1677ff]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-900 leading-tight">{job.title}</p>
                        {isLocked && <Lock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{job.address_text}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {dist !== null && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin className="w-3 h-3" />
                            {formatDistance(dist)}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          {job.urgency === "asap" ? (
                            <Zap className="w-3 h-3 text-[#faad14]" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {job.urgency === "asap" ? "ASAP" : "Scheduled"}
                        </span>
                        <span className="text-xs text-gray-400">{formatRelativeTime(job.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f0f0f0]">
                    <div>
                      {job.budget_min || job.budget_max ? (
                        <p className="font-semibold text-gray-900">
                          {job.budget_min && job.budget_max
                            ? `${formatCurrency(job.budget_min)} – ${formatCurrency(job.budget_max)}`
                            : job.budget_min
                              ? `From ${formatCurrency(job.budget_min)}`
                              : `Up to ${formatCurrency(job.budget_max!)}`}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400">Open to offers</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="default">{meta?.label}</Badge>
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
