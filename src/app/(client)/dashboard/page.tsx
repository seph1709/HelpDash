import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Card } from "@/views/components/shared/Card";
import { Badge, StatusBadge } from "@/views/components/shared/Badge";
import { JOB_CATEGORIES } from "@/types";
import { formatRelativeTime, formatCurrency } from "@/lib/utils";
import { PlusCircle, MapPin, ArrowRight, Briefcase } from "lucide-react";
import { CategoryIcon } from "@/lib/category-icons";
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
        <p className="text-xs font-medium text-[#1677ff] mb-0.5">Client Dashboard</p>
        <h1 className="text-xl font-semibold text-gray-900">Welcome back, {name}</h1>
        <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
          <MapPin className="w-3.5 h-3.5" />
          {profile?.barangay
            ? profile.barangay.split(",").slice(0, 2).join(", ")
            : "Quezon City, QC"}
        </p>
      </div>

      {/* Post Job CTA */}
      <Link href="/post-job">
        <div className="bg-[#1677ff] rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-[#4096ff] transition-colors">
          <div>
            <p className="font-semibold text-white">Need help with something?</p>
            <p className="text-blue-100 text-sm mt-0.5">
              Post a job — get help within 15 min
            </p>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <PlusCircle className="w-5 h-5 text-white" />
          </div>
        </div>
      </Link>

      {/* Quick category shortcuts */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Quick post</h2>
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
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-white border border-[#f0f0f0] hover:border-[#1677ff] hover:bg-[#e6f4ff] transition-all text-center"
              >
                <span className="w-9 h-9 rounded-lg bg-[#e6f4ff] flex items-center justify-center">
                  <CategoryIcon category={cat} className="w-4 h-4 text-[#1677ff]" />
                </span>
                <span className="text-xs text-gray-600 font-medium leading-tight">
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
            <h2 className="text-sm font-semibold text-gray-700">Active bookings</h2>
            <Link href="/bookings" className="text-xs text-[#1677ff] font-medium">
              See all
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {activeBookings.map((booking: any) => (
              <Link key={booking.id} href={`/bookings/${booking.id}`}>
                <Card hover padding="sm">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-[#e6f4ff] flex items-center justify-center flex-shrink-0">
                      <CategoryIcon category={booking.job?.category} className="w-4 h-4 text-[#1677ff]" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {booking.job?.title}
                      </p>
                      <p className="text-xs text-gray-400">
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
          <h2 className="text-sm font-semibold text-gray-700">Recent jobs</h2>
          <Link
            href="/bookings"
            className="text-xs text-[#1677ff] font-medium flex items-center gap-0.5"
          >
            See all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recentJobs && recentJobs.length > 0 ? (
          <div className="flex flex-col gap-2">
            {recentJobs.map((job: Job) => (
              <Card key={job.id} padding="sm">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#e6f4ff] flex items-center justify-center flex-shrink-0">
                    <CategoryIcon category={job.category} className="w-4 h-4 text-[#1677ff]" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {job.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusBadge status={job.status} />
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(job.created_at)}
                      </span>
                    </div>
                  </div>
                  {(job.budget_min || job.budget_max) && (
                    <span className="text-sm font-semibold text-gray-700 flex-shrink-0">
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
            <Briefcase className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No jobs posted yet.</p>
            <p className="text-gray-400 text-xs mt-1">Post your first job above!</p>
          </Card>
        )}
      </div>
    </div>
  );
}
