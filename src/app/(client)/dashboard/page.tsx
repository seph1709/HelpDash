import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Card } from "@/views/components/shared/Card";
import { Badge, StatusBadge } from "@/views/components/shared/Badge";
import { JOB_CATEGORIES } from "@/types";
import { formatRelativeTime, formatCurrency } from "@/lib/utils";
import { PlusCircle, MapPin, ArrowRight, Star } from "lucide-react";
import type { Job } from "@/types";

export default async function ClientDashboardPage() {
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
  const { data: recentJobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: activeBookings } = await supabase
    .from("bookings")
    .select(
      "*, job:jobs(*), provider:providers(*, user:users(name, avatar_url))",
    )
    .eq("client_id", user.id)
    .in("status", ["accepted", "en_route", "arrived", "in_progress"])
    .limit(3);

  const name = profile?.name?.split(" ")[0] ?? "there";

  return (
    <div className="flex flex-col gap-4">
      {/* Greeting */}
      <div className="pt-2">
        <h1 className="text-xl font-bold text-slate-900">Hey, {name} 👋</h1>
        <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
          <MapPin className="w-3.5 h-3.5" />
          {profile?.barangay ?? "Quezon City"}, QC
        </p>
      </div>

      {/* Post Job CTA */}
      <Link href="/post-job">
        <Card
          className="bg-gradient-to-r from-indigo-600 to-indigo-500 border-0 text-white"
          hover
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg">Need help with something?</p>
              <p className="text-indigo-200 text-sm mt-0.5">
                Post a job — get help within 15 min
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <PlusCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </Link>

      {/* Quick category shortcuts */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">
          Quick post
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              "plumbing",
              "electrical",
              "laundry",
              "cleaning",
              "aircon",
              "carpentry",
              "errands",
              "other",
            ] as const
          ).map((cat) => {
            const meta = JOB_CATEGORIES[cat];
            return (
              <Link
                key={cat}
                href={`/post-job?category=${cat}`}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-white border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all text-center"
              >
                <span className="text-2xl">{meta.icon}</span>
                <span className="text-xs text-slate-600 font-medium leading-tight">
                  {meta.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Active bookings */}
      {activeBookings && activeBookings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-700">
              Active bookings
            </h2>
            <Link
              href="/bookings"
              className="text-xs text-indigo-600 font-medium"
            >
              See all
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {activeBookings.map((booking: any) => (
              <Link key={booking.id} href={`/bookings/${booking.id}`}>
                <Card hover padding="sm">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {JOB_CATEGORIES[
                        booking.job?.category as keyof typeof JOB_CATEGORIES
                      ]?.icon ?? "💼"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 truncate">
                        {booking.job?.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {booking.provider?.user?.name}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent jobs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-700">Recent jobs</h2>
          <Link
            href="/bookings"
            className="text-xs text-indigo-600 font-medium flex items-center gap-0.5"
          >
            See all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recentJobs && recentJobs.length > 0 ? (
          <div className="flex flex-col gap-2">
            {recentJobs.map((job: Job) => (
              <Card key={job.id} padding="sm">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {JOB_CATEGORIES[job.category]?.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 truncate">
                      {job.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusBadge status={job.status} />
                      <span className="text-xs text-slate-400">
                        {formatRelativeTime(job.created_at)}
                      </span>
                    </div>
                  </div>
                  {(job.budget_min || job.budget_max) && (
                    <span className="text-sm font-semibold text-slate-700 flex-shrink-0">
                      {job.budget_min && job.budget_max
                        ? `${formatCurrency(job.budget_min)}–${formatCurrency(job.budget_max)}`
                        : job.budget_min
                          ? `From ${formatCurrency(job.budget_min)}`
                          : "Open"}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-8">
            <p className="text-slate-400 text-sm">No jobs posted yet.</p>
            <p className="text-slate-400 text-xs mt-1">
              Post your first job above!
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
