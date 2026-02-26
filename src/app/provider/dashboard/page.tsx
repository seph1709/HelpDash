import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Card } from "@/views/components/shared/Card";
import { Badge, StatusBadge } from "@/views/components/shared/Badge";
import { JOB_CATEGORIES } from "@/types";
import { formatRelativeTime, formatCurrency } from "@/lib/utils";
import { ToggleSwitch } from "@/views/components/shared/ToggleSwitch";
import {
  Star,
  Briefcase,
  TrendingUp,
  Clock,
  Crown,
  ArrowRight,
} from "lucide-react";

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

  console.log(recentBookings);
  console.log(users);

  function getUserName(job: any) {
    console.log(job["client_id"]);

    if (users != null)
      for (let index = 0; index < users.length; index++) {
        const element = users[index];
        if (element["id"] == job["client_id"]) {
          return element["name"];
          console.log(element);
        }
      }

    return "";
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Greeting + status */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Hey, {name} 👋</h1>
          <p className="text-sm text-slate-500">
            {provider.is_available
              ? "🟢 You are available"
              : "🔴 You are unavailable"}
          </p>
        </div>
        <ToggleSwitch
          checked={provider.is_available}
          providerId={user.id}
          label={provider.is_available ? "Online" : "Offline"}
        />
      </div>

      {/* Premium upsell */}
      {!isPremium && (
        <Card className="bg-gradient-to-r from-amber-500 to-orange-500 border-0 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Crown className="w-4 h-4" />
                <span className="font-semibold text-sm">
                  Go Premium — ₱99/mo
                </span>
              </div>
              <p className="text-orange-100 text-xs">
                See jobs 4 minutes before free-tier providers. Be first, win
                more gigs.
              </p>
            </div>
            <Link
              href="/provider/subscription"
              className="bg-white text-orange-600 text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0 hover:bg-orange-50"
            >
              Upgrade
            </Link>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card padding="sm" className="text-center">
          <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-bold text-slate-900">
              {provider.rating_avg?.toFixed(1) ?? "—"}
            </span>
          </div>
          <p className="text-xs text-slate-500">Rating</p>
        </Card>
        <Card padding="sm" className="text-center">
          <div className="font-bold text-slate-900 mb-1">
            {provider.total_jobs}
          </div>
          <p className="text-xs text-slate-500">Jobs done</p>
        </Card>
        <Card padding="sm" className="text-center">
          <div className="font-bold text-slate-900 mb-1">
            {isPremium ? "⚡" : "🆓"}
          </div>
          <p className="text-xs text-slate-500">
            {isPremium ? "Premium" : "Free tier"}
          </p>
        </Card>
      </div>

      {/* Job feed CTA */}
      <Link href="/provider/job-feed">
        <Card hover className="bg-indigo-600 border-0 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Browse Job Feed</p>
              <p className="text-indigo-200 text-sm mt-0.5">
                {isPremium
                  ? "Instant access to all new jobs"
                  : "Jobs visible 5 min after posting"}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-indigo-300" />
          </div>
        </Card>
      </Link>

      {/* Active jobs */}
      {pendingJobs && pendingJobs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-2">
            Active jobs
          </h2>
          <div className="flex flex-col gap-2">
            {pendingJobs.map((b: any) => (
              <Link key={b.id} href={`/provider/bookings/${b.id}`}>
                <Card hover padding="sm">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {
                        JOB_CATEGORIES[
                          b.job?.category as keyof typeof JOB_CATEGORIES
                        ]?.icon
                      }
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 truncate">
                        {b.job?.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {b.job?.address_text}
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent bookings */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-700">
            Recent bookings
          </h2>
          <Link
            href="/provider/bookings"
            className="text-xs text-indigo-600 font-medium"
          >
            See all
          </Link>
        </div>
        {recentBookings && recentBookings.length > 0 ? (
          <div className="flex flex-col gap-2">
            {recentBookings.map((b: any) => (
              <Card key={b.id} padding="sm">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {
                      JOB_CATEGORIES[
                        b.job?.category as keyof typeof JOB_CATEGORIES
                      ]?.icon
                    }
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 truncate">
                      {b.job?.title}

                      <span className="text-gray-500 text-[11.5px]">
                        {" @"}
                        {getUserName(b)}
                      </span>
                    </p>
                    <span className="text-xs text-slate-400">
                      {formatRelativeTime(b.created_at)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={b.status} />
                    {b.agreed_price && (
                      <span className="text-xs font-semibold text-slate-700">
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
            <p className="text-slate-400 text-sm">No bookings yet.</p>
            <p className="text-slate-400 text-xs mt-1">
              Check the job feed to find work nearby!
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
