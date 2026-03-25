import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Card } from "@/views/components/shared/Card";
import { StatusBadge } from "@/views/components/shared/Badge";
import { formatRelativeTime, formatCurrency } from "@/lib/utils";
import {
  Star,
  Briefcase,
  Crown,
  ArrowRight,
  Zap,
  Shield,
} from "lucide-react";
import { CategoryIcon } from "@/lib/category-icons";

const JOB_STEPS = [
  { key: 'accepted',     label: 'Accepted' },
  { key: 'en_route',    label: 'On the way' },
  { key: 'arrived',     label: 'Arrived' },
  { key: 'in_progress', label: 'Working' },
  { key: 'done',        label: 'Done' },
]

export default async function ProviderDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();
  const { data: provider } = await supabase
    .from("providers")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!provider) redirect("/provider/onboarding");

  // Auto-set available whenever the provider opens their dashboard
  await supabase.from("providers").update({ is_available: true }).eq("id", user.id);

  const { data: recentBookings } = await supabase
    .from("bookings")
    .select("*, job:jobs(title, category)")
    .eq("provider_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: pendingJobs } = await supabase
    .from("bookings")
    .select("*, job:jobs(title, category, address_text)")
    .eq("provider_id", user.id)
    .in("status", ["accepted", "en_route", "arrived", "in_progress"])
    .limit(3);

  const { data: users } = await supabase.from("users").select("*");

  const isPremium = provider.subscription_tier === "premium";
  const name = profile?.name?.split(" ")[0] ?? "there";

  function getUserName(job: any) {
    if (users != null)
      for (let index = 0; index < users.length; index++) {
        const element = users[index];
        if (element["id"] == job["client_id"]) {
          return element["name"];
        }
      }
    return "";
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Greeting */}
      <div className="pt-2">
        <p className="text-xs font-medium text-[#0068C9] mb-0.5">Provider Dashboard</p>
        <h1 className="text-xl font-semibold text-gray-900">Welcome back, {name}</h1>
        <p className="flex items-center gap-1.5 text-sm mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#52c41a] animate-pulse" />
          <span className="text-[#52c41a] font-medium">Available for work</span>
        </p>
      </div>

      {/* Pinned active jobs */}
      {pendingJobs && pendingJobs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#52c41a] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#52c41a]" />
            </span>
            <h2 className="text-sm font-semibold text-gray-700">Current job</h2>
          </div>
          <div className="flex flex-col gap-2">
            {pendingJobs.map((b: any) => {
              const stepIndex = JOB_STEPS.findIndex((s) => s.key === b.status)
              return (
                <Link key={b.id} href={`/provider/bookings/${b.id}`}>
                  <div className="rounded-lg bg-[#FF9012] p-4 flex flex-col gap-3.5 shadow-[0_4px_12px_rgba(255,144,18,0.3)] hover:shadow-[0_6px_16px_rgba(255,144,18,0.4)] hover:-translate-y-0.5 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-4 h-4 text-white" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-white truncate">
                          {b.job?.title}
                        </p>
                        <p className="text-xs text-blue-100 truncate mt-0.5">
                          {b.job?.address_text}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/60 flex-shrink-0" />
                    </div>
                    {/* Progress steps */}
                    <div className="flex items-center">
                      {JOB_STEPS.map((step, i) => {
                        const done = i < stepIndex
                        const active = i === stepIndex
                        return (
                          <div key={step.key} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                              <div className={`w-3 h-3 rounded-full transition-all ${
                                done
                                  ? 'bg-[#52c41a]'
                                  : active
                                    ? 'bg-white ring-2 ring-white/40'
                                    : 'bg-white/20'
                              }`} />
                              <span className={`text-[10px] font-medium leading-none text-center ${
                                active ? 'text-white' : done ? 'text-green-300' : 'text-white/30'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                            {i < JOB_STEPS.length - 1 && (
                              <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full transition-colors ${
                                done ? 'bg-[#52c41a]/60' : 'bg-white/20'
                              }`} />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Premium upsell */}
      {!isPremium && (
        <div className="rounded-lg border border-[#ffe58f] bg-[#fffbe6] p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Crown className="w-4 h-4 text-[#faad14]" />
                <span className="font-semibold text-sm text-gray-900">
                  Go Premium — ₱99/mo
                </span>
              </div>
              <p className="text-gray-500 text-xs">
                See jobs 4 minutes before free-tier providers.
              </p>
            </div>
            <Link
              href="/provider/subscription"
              className="bg-[#faad14] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 hover:bg-[#d48806] transition-colors"
            >
              Upgrade
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card padding="sm" className="text-center">
          <div className="w-8 h-8 rounded-lg bg-[#fffbe6] flex items-center justify-center mx-auto mb-1.5">
            <Star className="w-4 h-4 text-[#faad14] fill-[#faad14]" />
          </div>
          <div className="font-bold text-gray-900 text-base leading-none">
            {provider.rating_avg?.toFixed(1) ?? "—"}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Rating</p>
        </Card>
        <Card padding="sm" className="text-center">
          <div className="w-8 h-8 rounded-lg bg-[#fff3e0] flex items-center justify-center mx-auto mb-1.5">
            <Briefcase className="w-4 h-4 text-[#FF9012]" />
          </div>
          <div className="font-bold text-gray-900 text-base leading-none">
            {provider.total_jobs}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Jobs done</p>
        </Card>
        <Card padding="sm" className="text-center">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5 ${isPremium ? 'bg-[#fffbe6]' : 'bg-gray-50'}`}>
            {isPremium
              ? <Zap className="w-4 h-4 text-[#faad14]" />
              : <Shield className="w-4 h-4 text-gray-400" />}
          </div>
          <p className="text-xs text-gray-400">{isPremium ? "Premium" : "Free tier"}</p>
        </Card>
      </div>

      {/* Job feed CTA */}
      <Link href="/provider/job-feed">
        <div className="bg-[#FF9012] rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-[#ffaa3c] transition-colors">
          <div>
            <p className="font-semibold text-white">Browse Job Feed</p>
            <p className="text-blue-100 text-sm mt-0.5">
              {isPremium
                ? "Instant access to all new jobs"
                : "Jobs visible 5 min after posting"}
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <ArrowRight className="w-5 h-5 text-white" />
          </div>
        </div>
      </Link>

      {/* Recent bookings */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700">Recent bookings</h2>
          <Link href="/provider/bookings" className="text-xs text-[#0068C9] font-medium">
            See all
          </Link>
        </div>
        {recentBookings && recentBookings.length > 0 ? (
          <div className="flex flex-col gap-2">
            {recentBookings.map((b: any) => (
              <Card key={b.id} padding="sm">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#fff3e0] flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-4 h-4 text-[#FF9012]" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {b.job?.title}
                      <span className="text-gray-400 text-[11.5px]">
                        {" @"}
                        {getUserName(b)}
                      </span>
                    </p>
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(b.created_at)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={b.status} />
                    {b.agreed_price && (
                      <span className="text-xs font-semibold text-gray-700">
                        {formatCurrency(b.agreed_price)}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-6">
            <Briefcase className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No bookings yet.</p>
            <p className="text-gray-400 text-xs mt-1">Check the job feed to find work nearby!</p>
          </Card>
        )}
      </div>
    </div>
  );
}
