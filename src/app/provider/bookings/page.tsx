import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Card } from "@/views/components/shared/Card";
import { StatusBadge } from "@/views/components/shared/Badge";
import { formatRelativeTime, formatCurrency } from "@/lib/utils";
import type { Booking } from "@/types";
import { BookingBadgeRow } from "@/views/components/booking/BookingBadgeRow";
import { ClipboardList } from "lucide-react";
import { CategoryIcon } from "@/lib/category-icons";

export default async function ProviderBookingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, job:jobs(title, category, address_text), client:users(name, avatar_url)")
    .eq("provider_id", user.id)
    .order("created_at", { ascending: false });

  const active = (bookings ?? []).filter((b: any) =>
    ["accepted", "en_route", "arrived", "in_progress"].includes(b.status),
  );
  const past = (bookings ?? []).filter(
    (b: any) =>
      !["accepted", "en_route", "arrived", "in_progress"].includes(b.status),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="pt-2">
        <p className="text-xs font-medium text-[#1677ff] mb-0.5">Bookings</p>
        <h1 className="text-xl font-semibold text-gray-900">My Bookings</h1>
        <p className="text-sm text-gray-400">{bookings?.length ?? 0} total</p>
      </div>

      {/* Active jobs */}
      {active.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Active</h2>
          <div className="flex flex-col gap-2">
            {active.map((booking: any) => (
              <BookingRow key={booking.id} booking={booking} />
            ))}
          </div>
        </section>
      )}

      {/* Past jobs */}
      <section>
        {active.length > 0 && (
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Past</h2>
        )}
        {past.length > 0 ? (
          <div className="flex flex-col gap-2">
            {past.map((booking: any) => (
              <BookingRow key={booking.id} booking={booking} />
            ))}
          </div>
        ) : active.length === 0 ? (
          <Card className="text-center py-10">
            <ClipboardList className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="font-medium text-gray-700">No bookings yet</p>
            <p className="text-sm text-gray-400 mt-1">Browse the job feed to find work nearby.</p>
            <Link href="/provider/job-feed" className="mt-4 inline-flex items-center text-[#1677ff] font-medium text-sm">
              Browse jobs →
            </Link>
          </Card>
        ) : null}
      </section>
    </div>
  );
}

function BookingRow({ booking }: { booking: any }) {
  return (
    <BookingBadgeRow bookingId={booking.id} href={`/provider/bookings/${booking.id}`} status={booking.status}>
      <Card hover padding="sm">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-lg bg-[#e6f4ff] flex items-center justify-center flex-shrink-0">
            <CategoryIcon category={booking.job?.category} className="w-4 h-4 text-[#1677ff]" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 truncate">{booking.job?.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {booking.client?.name && (
                <p className="text-xs text-gray-400 truncate">{booking.client.name}</p>
              )}
              <span className="text-xs text-gray-200">·</span>
              <span className="text-xs text-gray-400">{formatRelativeTime(booking.created_at)}</span>
            </div>
            {booking.job?.address_text && (
              <p className="text-xs text-gray-400 truncate mt-0.5">{booking.job.address_text}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <StatusBadge status={booking.status} />
            {booking.agreed_price && (
              <span className="text-xs font-semibold text-gray-700">{formatCurrency(booking.agreed_price)}</span>
            )}
          </div>
        </div>
      </Card>
    </BookingBadgeRow>
  );
}
