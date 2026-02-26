"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { Button } from "@/views/components/shared/Button";
import { Input, Textarea } from "@/views/components/shared/Input";
import { Card } from "@/views/components/shared/Card";
import { Avatar } from "@/views/components/shared/Avatar";
import { Badge } from "@/views/components/shared/Badge";
import { StarRating } from "@/views/components/shared/StarRating";
import { JOB_CATEGORIES, type JobCategory } from "@/types";
import { Edit2, CheckCircle, Star } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

export default function ProviderProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<JobCategory[]>([]);
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: p }, { data: prov }, completedRes] = await Promise.all([
        supabase.from("users").select("*").eq("id", user.id).single(),
        supabase.from("providers").select("*").eq("id", user.id).single(),
        fetch("/api/provider/completed-jobs").then((r) => r.json()),
      ]);

      const jobs = Array.isArray(completedRes) ? completedRes : [];

      setProfile(p);
      setProvider(prov);
      setBio(prov?.bio ?? "");
      setHourlyRate(prov?.hourly_rate?.toString() ?? "");
      setSelectedSkills(prov?.skills ?? []);
      setCompletedJobs(jobs);
      setLoading(false);

      // Refresh pre-computed stats in DB in background (trigger fails due to RLS)
      if (p?.id) {
        fetch("/api/provider/update-stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ providerId: p.id }),
        }).catch(() => {});
      }
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error();

      await supabase
        .from("providers")
        .update({
          bio,
          hourly_rate: hourlyRate ? parseInt(hourlyRate) : null,
          skills: selectedSkills,
        })
        .eq("id", user.id);

      toast.success("Profile updated");
      setEditing(false);
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (skill: JobCategory) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-slate-900">My Profile</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditing(!editing)}
        >
          <Edit2 className="w-4 h-4" />
          {editing ? "Cancel" : "Edit"}
        </Button>
      </div>

      {/* Profile card */}
      <Card>
        <div className="flex items-center gap-4">
          <Avatar name={profile?.name} src={profile?.avatar_url} size="xl" />
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-slate-900 text-lg">
              {profile?.name}
            </h2>
            <p className="text-sm text-slate-500">
              {profile?.barangay}, Quezon City
            </p>
            <div className="flex items-center gap-2 mt-1">
              {(() => {
                const reviews = completedJobs.filter((j) => j.review?.score);
                const avg = reviews.length
                  ? reviews.reduce(
                      (s: number, j: any) => s + j.review.score,
                      0,
                    ) / reviews.length
                  : 0;
                return (
                  <>
                    <StarRating value={avg} readonly size="sm" />
                    <span className="text-xs text-slate-500">
                      {reviews.length > 0 ? avg.toFixed(1) : "—"} (
                      {completedJobs.length} jobs)
                    </span>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {provider?.id_verified && (
          <div className="flex items-center gap-1.5 mt-3 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            ID Verified
          </div>
        )}

        {provider?.subscription_tier === "premium" && (
          <Badge variant="premium" className="mt-2">
            ⚡ Premium Provider
          </Badge>
        )}
      </Card>

      {/* Skills */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-slate-900">Skills</p>
        </div>
        {editing ? (
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(JOB_CATEGORIES) as [JobCategory, any][]).map(
              ([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSkill(key)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 text-xs transition-all ${
                    selectedSkills.includes(key)
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-100 bg-white"
                  }`}
                >
                  <span className="text-xl">{meta.icon}</span>
                  <span className="font-medium text-slate-700 text-center leading-tight">
                    {meta.label}
                  </span>
                </button>
              ),
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(selectedSkills.length > 0 ? selectedSkills : []).map((s) => (
              <Badge key={s} variant="info">
                {JOB_CATEGORIES[s]?.icon} {JOB_CATEGORIES[s]?.label}
              </Badge>
            ))}
            {selectedSkills.length === 0 && (
              <p className="text-sm text-slate-400">No skills set</p>
            )}
          </div>
        )}
      </Card>

      {/* Bio & Rate */}
      <Card>
        <p className="font-semibold text-slate-900 mb-3">About & Rates</p>
        {editing ? (
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell clients about your experience and specialty..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <Input
              label="Hourly rate (₱)"
              type="number"
              placeholder="e.g. 250"
              min="0" // Prevents the stepper arrows
              onKeyDown={(e) => {
                // If user hits "-", "e", or "E", stop the event immediately
                if (e.key === "-" || e.key === "e" || e.key === "E") {
                  e.preventDefault();
                }
              }}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-slate-700">
              {bio || <span className="text-slate-400">No bio yet</span>}
            </p>
            {hourlyRate && (
              <p className="text-sm font-semibold text-slate-900">
                ₱{hourlyRate}/hour
              </p>
            )}
          </div>
        )}
      </Card>

      {editing && (
        <Button onClick={save} loading={saving} fullWidth size="lg">
          Save Changes
        </Button>
      )}

      {/* Completed jobs & reviews */}
      <div className="flex items-center justify-between mt-2">
        <h2 className="font-bold text-slate-900">Completed Jobs</h2>
        <span className="text-sm text-slate-400">
          {completedJobs.length} total
        </span>
      </div>

      {completedJobs.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-2xl mb-2">🏅</p>
          <p className="text-sm font-medium text-slate-700">
            No completed jobs yet
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Completed jobs and client reviews will show here.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {completedJobs.map((booking: any) => {
            const meta = JOB_CATEGORIES[booking.job?.category as JobCategory];
            const review = booking.review ?? null;
            return (
              <Card key={booking.id}>
                {/* Job row */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl flex-shrink-0 border border-slate-100">
                    {meta?.icon ?? "💼"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm leading-tight">
                      {booking.job?.title ?? "Job"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatRelativeTime(booking.created_at)}
                    </p>
                  </div>
                  {booking.agreed_price && (
                    <p className="text-sm font-semibold text-slate-700 flex-shrink-0">
                      ₱{booking.agreed_price.toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Review */}
                {review ? (
                  <div className="mt-3 pt-3 border-t border-slate-50">
                    {/* Stars */}
                    <div className="flex items-center gap-1 mb-1.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`w-3.5 h-3.5 ${n <= review.score ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                        />
                      ))}
                      <span className="text-xs text-slate-500 ml-1">
                        {review.score}/5
                      </span>
                    </div>
                    {/* Comment */}
                    {review.comment && (
                      <p className="text-sm text-slate-600 italic">
                        "{review.comment}"
                      </p>
                    )}
                    {/* Reviewer */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-5 h-5 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                        {review.from_user?.avatar_url ? (
                          <img
                            src={review.from_user.avatar_url}
                            className="w-5 h-5 object-cover"
                            alt=""
                          />
                        ) : null}
                      </div>
                      <p className="text-xs text-slate-400">
                        {review.from_user?.name ?? "Client"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 pt-3 border-t border-slate-50 text-xs text-slate-400">
                    No review left
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
