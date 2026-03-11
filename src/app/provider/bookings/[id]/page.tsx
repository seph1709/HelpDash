import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Card } from "@/views/components/shared/Card";
import { StatusBadge } from "@/views/components/shared/Badge";
import { formatRelativeTime, formatCurrency } from "@/lib/utils";
import { ChevronLeft, MapPin, User } from "lucide-react";
import { CategoryIcon } from "@/lib/category-icons";
import { ProviderBookingActions } from "./ProviderBookingActions";
import { LocationSharer } from "@/views/components/map/LocationSharer";
import { ChatBox } from "@/views/components/chat/ChatBox";
import { BookingRealtimeSync } from "./BookingRealtimeSync";

export default async function ProviderBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      `
      *,
      job:jobs(id, title, description, category, address_text, barangay, budget_min, budget_max, urgency, scheduled_at, lat, lng),
      client:users(id, name, avatar_url, barangay, gcash_number)
    `,
    )
    .eq("id", id)
    .eq("provider_id", user.id)
    .single();

  if (!booking) notFound();

  const { data: currentUserProfile } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .single();

  const job = booking.job as any;
  const client = booking.client as any;

  const statusSteps = [
    "pending",
    "accepted",
    "en_route",
    "arrived",
    "in_progress",
    "done",
  ];
  const currentStep = statusSteps.indexOf(booking.status);

  return (
    <div className="flex flex-col gap-4 pb-32">
      <BookingRealtimeSync bookingId={booking.id} />
      {/* Back */}
      <div className="flex items-center gap-2 pt-2">
        <Link
          href="/provider/bookings"
          className="p-2 rounded-lg hover:bg-gray-50 -ml-2"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="font-semibold text-gray-900">Booking</h1>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {/* Job info */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-[#e6f4ff] flex items-center justify-center flex-shrink-0">
            <CategoryIcon category={job?.category} className="w-5 h-5 text-[#1677ff]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900">{job?.title}</p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {job?.address_text}
            </p>
            {job?.description && (
              <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                {job.description}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Progress */}
      {currentStep >= 0 &&
        !["cancelled", "disputed"].includes(booking.status) && (
          <Card>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Progress
            </p>
            <div className="flex items-center gap-1">
              {statusSteps.map((step, i) => {
                const done = i < currentStep;
                const active = i === currentStep;
                return (
                  <div
                    key={step}
                    className="flex items-center gap-1 flex-1 last:flex-none"
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors ${
                        done
                          ? "bg-[#52c41a]"
                          : active
                            ? "bg-[#1677ff] ring-2 ring-[#91caff]"
                            : "bg-gray-200"
                      }`}
                      style={
                        active
                          ? {
                              animation:
                                "indigo-glow 1.8s ease-in-out infinite",
                            }
                          : undefined
                      }
                    />
                    {i < statusSteps.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 rounded-full transition-colors ${
                          done ? "bg-[#73d13d]" : "bg-gray-100"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-1.5">
              {statusSteps.map((step, i) => (
                <p
                  key={step}
                  className={`text-[10px] capitalize ${
                    i === currentStep
                      ? "text-[#1677ff] font-semibold"
                      : i < currentStep
                        ? "text-[#52c41a]"
                        : "text-gray-300"
                  }`}
                >
                  {step.replace("_", " ")}
                </p>
              ))}
            </div>
          </Card>
        )}

      {/* Location sharing — active when en route */}
      {booking.status === "en_route" && (
        <LocationSharer bookingId={booking.id} providerId={user.id} />
      )}

      {/* Price */}
      <div className="grid grid-cols-2 gap-3">
        <Card padding="sm">
          <p className="text-xs text-gray-400 mb-0.5">Agreed price</p>
          <p className="font-semibold text-gray-900 text-sm">
            {booking.agreed_price ? formatCurrency(booking.agreed_price) : "—"}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-gray-400 mb-0.5">Budget</p>
          <p className="font-semibold text-gray-900 text-sm">
            {job?.budget_min || job?.budget_max
              ? job.budget_min && job.budget_max
                ? `${formatCurrency(job.budget_min)} – ${formatCurrency(job.budget_max)}`
                : job.budget_min
                  ? `From ${formatCurrency(job.budget_min)}`
                  : `Up to ${formatCurrency(job.budget_max)}`
              : "Open to offers"}
          </p>
        </Card>
      </div>

      {/* Client info */}
      {client && (
        <Card>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Client
          </p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {client.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={client.avatar_url}
                  className="w-12 h-12 object-cover"
                  alt={client.name ?? "Client"}
                />
              ) : (
                <User className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">
                {client.name ?? "Client"}
              </p>
              {client.barangay && (
                <p className="text-xs text-gray-400">{client.barangay}</p>
              )}
              {["in_progress", "done"].includes(booking.status) &&
                client.gcash_number && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    GCash:{" "}
                    <span className="font-medium text-gray-700">
                      {client.gcash_number}
                    </span>
                  </p>
                )}
            </div>
          </div>
        </Card>
      )}

      {/* Completion status */}
      {booking.status === "done" && !booking.client_confirmed && (
        <Card padding="sm" className="border-[#ffe58f] bg-[#fffbe6]">
          <p className="text-xs text-[#d48806] font-semibold mb-0.5">
            Waiting for client confirmation
          </p>
          <p className="text-xs text-[#ad6800]">
            The booking will be marked complete once the client confirms the
            work is done.
          </p>
        </Card>
      )}
      {booking.status === "done" && booking.client_confirmed && (
        <Card padding="sm" className="border-[#b7eb8f] bg-[#f6ffed]">
          <p className="text-xs text-[#389e0d] font-semibold mb-0.5">
            Job completed
          </p>
          <p className="text-xs text-[#52c41a]">
            Client has confirmed the work. Well done!
          </p>
        </Card>
      )}

      {/* Chat — visible once booking is accepted */}
      {["accepted", "en_route", "arrived", "in_progress", "done"].includes(
        booking.status,
      ) && (
        <ChatBox
          bookingId={booking.id}
          currentUserId={user.id}
          currentUserName={currentUserProfile?.name ?? "You"}
          readonly={booking.status === "done"}
        />
      )}

      {/* Applied time */}
      <Card padding="sm">
        <p className="text-xs text-gray-400 mb-0.5">Applied</p>
        <p className="text-sm font-medium text-gray-700">
          {formatRelativeTime(booking.created_at)}
        </p>
      </Card>

      {/* Actions */}
      <div className="fixed bottom-20 left-0 right-0 px-4 max-w-lg mx-auto">
        <ProviderBookingActions
          bookingId={booking.id}
          status={booking.status}
          clientId={booking.client_id}
          jobTitle={job?.title ?? "your job"}
        />
      </div>
    </div>
  );
}
