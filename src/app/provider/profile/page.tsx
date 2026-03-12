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
import { Edit2, CheckCircle, Star, Zap, Award, Pencil } from "lucide-react";
import { CategoryIcon } from "@/lib/category-icons";
import { formatRelativeTime } from "@/lib/utils";
import { AvatarPicker } from "@/views/components/shared/AvatarPicker";

export default function ProviderProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
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
      setAvatarUrl(p?.avatar_url ?? null);
      setCompletedJobs(jobs);
      setLoading(false);

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

      await Promise.all([
        supabase.from("providers").update({
          bio,
          hourly_rate: hourlyRate ? parseInt(hourlyRate) : null,
          skills: selectedSkills,
        }).eq("id", user.id),
        supabase.from("users").update({ avatar_url: avatarUrl }).eq("id", user.id),
      ]);

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
        <div className="w-8 h-8 rounded-full border-2 border-[#1677ff] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[#1677ff] mb-0.5">Profile</p>
          <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
        </div>
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
          <div className="relative flex-shrink-0">
            <Avatar name={profile?.name} src={avatarUrl} size="xl" />
            {editing && (
              <button
                type="button"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#1677ff] rounded-full flex items-center justify-center shadow border-2 border-white"
              >
                <Pencil className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 text-lg">
              {profile?.name}
            </h2>
            <p className="text-sm text-gray-400">
              {profile?.barangay}
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
                    <span className="text-xs text-gray-400">
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
          <div className="flex items-center gap-1.5 mt-3 text-sm text-[#52c41a]">
            <CheckCircle className="w-4 h-4" />
            ID Verified
          </div>
        )}

        {provider?.subscription_tier === "premium" && (
          <Badge variant="premium" className="mt-2 flex items-center gap-1">
            <Zap className="w-3 h-3" /> Premium Provider
          </Badge>
        )}

        {editing && showAvatarPicker && (
          <div className="mt-4 pt-4 border-t border-[#f0f0f0]">
            <AvatarPicker
              currentUrl={avatarUrl}
              onSelect={(url) => {
                setAvatarUrl(url)
                setShowAvatarPicker(false)
              }}
            />
          </div>
        )}
      </Card>

      {/* Skills */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-gray-900">Skills</p>
        </div>
        {editing ? (
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(JOB_CATEGORIES) as [JobCategory, any][]).map(
              ([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSkill(key)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 text-xs transition-all ${
                    selectedSkills.includes(key)
                      ? "border-[#1677ff] bg-[#e6f4ff]"
                      : "border-[#f0f0f0] bg-white"
                  }`}
                >
                  <span className="w-8 h-8 rounded-lg bg-[#e6f4ff] flex items-center justify-center">
                    <CategoryIcon category={key} className="w-4 h-4 text-[#1677ff]" />
                  </span>
                  <span className="font-medium text-gray-700 text-center leading-tight">
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
                {JOB_CATEGORIES[s]?.label}
              </Badge>
            ))}
            {selectedSkills.length === 0 && (
              <p className="text-sm text-gray-400">No skills set</p>
            )}
          </div>
        )}
      </Card>

      {/* Bio & Rate */}
      <Card>
        <p className="font-semibold text-gray-900 mb-3">About & Rates</p>
        {editing ? (
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell clients about your experience and specialty..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-[#d9d9d9] bg-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#1677ff] focus:border-[#1677ff] hover:border-[#1677ff] transition-colors"
              />
            </div>
            <Input
              label="Hourly rate (₱)"
              type="number"
              placeholder="e.g. 250"
              min="0"
              onKeyDown={(e) => {
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
            <p className="text-sm text-gray-700">
              {bio || <span className="text-gray-400">No bio yet</span>}
            </p>
            {hourlyRate && (
              <p className="text-sm font-semibold text-gray-900">
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
        <h2 className="font-semibold text-gray-900">Completed Jobs</h2>
        <span className="text-sm text-gray-400">
          {completedJobs.length} total
        </span>
      </div>

      {completedJobs.length === 0 ? (
        <Card className="text-center py-10">
          <Award className="w-7 h-7 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700">
            No completed jobs yet
          </p>
          <p className="text-xs text-gray-400 mt-1">
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
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#e6f4ff] flex items-center justify-center flex-shrink-0">
                    <CategoryIcon category={booking.job?.category} className="w-4 h-4 text-[#1677ff]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm leading-tight">
                      {booking.job?.title ?? "Job"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatRelativeTime(booking.created_at)}
                    </p>
                  </div>
                  {booking.agreed_price && (
                    <p className="text-sm font-semibold text-gray-700 flex-shrink-0">
                      ₱{booking.agreed_price.toLocaleString()}
                    </p>
                  )}
                </div>

                {review ? (
                  <div className="mt-3 pt-3 border-t border-[#f0f0f0]">
                    <div className="flex items-center gap-1 mb-1.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`w-3.5 h-3.5 ${n <= review.score ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                        />
                      ))}
                      <span className="text-xs text-gray-400 ml-1">
                        {review.score}/5
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600 italic">
                        "{review.comment}"
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-5 h-5 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                        {review.from_user?.avatar_url ? (
                          <img
                            src={review.from_user.avatar_url}
                            className="w-5 h-5 object-cover"
                            alt=""
                          />
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-400">
                        {review.from_user?.name ?? "Client"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 pt-3 border-t border-[#f0f0f0] text-xs text-gray-400">
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
