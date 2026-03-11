"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { Button } from "@/views/components/shared/Button";
import { Input, Textarea, Select } from "@/views/components/shared/Input";
import { Card } from "@/views/components/shared/Card";
import { LocationPicker } from "@/views/components/map/LocationPicker";
import { JOB_CATEGORIES, BARANGAYS_QC, type JobCategory } from "@/types";
import { ChevronLeft, Mic, Clock, Zap } from "lucide-react";
import { CategoryIcon } from "@/lib/category-icons";
import Link from "next/link";
import { cn } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(3, "Please describe the job (min 3 chars)"),
  description: z.string().optional(),
  category: z.enum([
    "plumbing",
    "electrical",
    "laundry",
    "cleaning",
    "carpentry",
    "aircon",
    "painting",
    "appliance_repair",
    "moving",
    "errands",
    "tutoring",
    "other",
  ]),
  budget_min: z.coerce
    .number()
    .min(0, { message: "Budget cannot be negative" })
    .optional(),
  budget_max: z.coerce
    .number()
    .min(0, { message: "Budget cannot be negative" })
    .optional(),
  urgency: z.enum(["asap", "scheduled"]),
  scheduled_at: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const STEPS = ["Category", "Details", "Location", "Budget"] as const;

export default function PostJobPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCategory = searchParams.get(
    "category",
  ) as JobCategory | null;

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      category: preselectedCategory ?? "plumbing",
      urgency: "asap",
    },
  });

  const urgency = watch("urgency");
  const category = watch("category");

  useEffect(() => {
    if (preselectedCategory) {
      setValue("category", preselectedCategory);
      setStep(1);
    }
  }, [preselectedCategory, setValue]);

  const goNext = async () => {
    let fields: (keyof FormData)[] = [];
    if (step === 0) fields = ["category"];
    if (step === 1) fields = ["title", "urgency"];

    const valid = await trigger(fields);
    if (valid) setStep((s) => s + 1);
  };

  const onSubmit = async (data: FormData) => {
    if (!location) {
      toast.error("Please pin your job location on the map");
      return;
    }
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("jobs").insert({
        client_id: user.id,
        title: data.title,
        description: data.description,
        category: data.category,
        lat: location.lat,
        lng: location.lng,
        address_text: location.address,
        budget_min: data.budget_min,
        budget_max: data.budget_max,
        urgency: data.urgency,
        scheduled_at:
          data.urgency === "scheduled" ? data.scheduled_at : undefined,
        visible_to_free_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });

      if (error) throw new Error(error.message);

      toast.success("Job posted! Providers are being notified.");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post job");
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryMeta = JOB_CATEGORIES[category];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        {step > 0 ? (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="p-2 rounded-lg hover:bg-gray-50 -ml-2"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        ) : (
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-gray-50 -ml-2"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
        )}
        <div>
          <h1 className="font-semibold text-gray-900">Post a Job</h1>
          <p className="text-xs text-gray-400">
            {STEPS[step]} · Step {step + 1} of {STEPS.length}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#1677ff] rounded-full transition-all duration-300"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 0: Category */}
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600">
              What kind of help do you need?
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(
                Object.entries(JOB_CATEGORIES) as [
                  JobCategory,
                  (typeof JOB_CATEGORIES)[JobCategory],
                ][]
              ).map(([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setValue("category", key);
                    goNext();
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                    category === key
                      ? "border-[#1677ff] bg-[#e6f4ff]"
                      : "border-[#f0f0f0] bg-white hover:border-[#91caff]",
                  )}
                >
                  <span className="w-10 h-10 rounded-lg bg-[#e6f4ff] flex items-center justify-center">
                    <CategoryIcon category={key} className="w-5 h-5 text-[#1677ff]" />
                  </span>
                  <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                    {meta.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Job Details */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
              <span className="w-8 h-8 rounded-lg bg-[#e6f4ff] flex items-center justify-center flex-shrink-0">
                <CategoryIcon category={category} className="w-4 h-4 text-[#1677ff]" />
              </span>
              <span>{selectedCategoryMeta?.label}</span>
            </div>
            <Input
              label="What do you need done?"
              placeholder={`e.g. ${category === "plumbing" ? "Leaking faucet in bathroom" : category === "laundry" ? "3 bags of laundry, fold and press" : "Describe the job..."}`}
              required
              error={errors.title?.message}
              {...register("title")}
            />
            <Textarea
              label="More details (optional)"
              placeholder="Any additional info — materials needed, difficulty, access instructions..."
              {...register("description")}
            />

            {/* Voice note hint */}
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
              <Mic className="w-3.5 h-3.5" />
              Voice notes and photos can be added after posting (coming soon)
            </div>

            {/* Urgency */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                When do you need this?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setValue("urgency", "asap")}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border-2 transition-all",
                    urgency === "asap"
                      ? "border-[#1677ff] bg-[#e6f4ff]"
                      : "border-[#f0f0f0] bg-white",
                  )}
                >
                  <Zap className="w-4 h-4 text-amber-500" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">ASAP</p>
                    <p className="text-xs text-gray-400">Right now</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setValue("urgency", "scheduled")}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border-2 transition-all",
                    urgency === "scheduled"
                      ? "border-[#1677ff] bg-[#e6f4ff]"
                      : "border-[#f0f0f0] bg-white",
                  )}
                >
                  <Clock className="w-4 h-4 text-[#1677ff]" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">
                      Schedule
                    </p>
                    <p className="text-xs text-gray-400">Pick a time</p>
                  </div>
                </button>
              </div>
              {urgency === "scheduled" && (
                <Input
                  type="datetime-local"
                  className="mt-2"
                  {...register("scheduled_at")}
                />
              )}
            </div>

            <Button type="button" onClick={goNext} fullWidth size="lg">
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-semibold text-gray-900">
                Where is the job?
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                Tap the map or drag the pin to the exact location. Address is
                required.
              </p>
            </div>
            <LocationPicker
              onLocationSelect={(lat, lng, address) =>
                setLocation({ lat, lng, address })
              }
              height="320px"
              showRadius
            />
            <Button
              type="button"
              onClick={() => {
                if (!location) {
                  toast.error("Please pin a location first");
                  return;
                }
                setStep(3);
              }}
              fullWidth
              size="lg"
              disabled={!location}
            >
              Confirm location
            </Button>
          </div>
        )}

        {/* Step 3: Budget */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-semibold text-gray-900">Set your budget</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                Providers will see this range. Leave blank to accept offers.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Min budget (₱)"
                type="number"
                min={0}
                placeholder="e.g. 300"
                hint="Minimum you're willing to pay"
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e" || e.key === "E") {
                    e.preventDefault();
                  }
                }}
                {...register("budget_min")}
              />
              <Input
                label="Max budget (₱)"
                type="number"
                min={0}
                placeholder="e.g. 800"
                hint="Maximum budget"
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e" || e.key === "E") {
                    e.preventDefault();
                  }
                }}
                {...register("budget_max")}
              />
            </div>

            {/* Summary card */}
            <Card className="bg-gray-50 border-[#f0f0f0]">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Job Summary
              </p>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Type</span>
                  <span className="font-medium">
                    {selectedCategoryMeta?.label}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Urgency</span>
                  <span className="font-medium capitalize">{urgency}</span>
                </div>
                {location && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Location</span>
                    <span className="font-medium text-right max-w-[60%] truncate">
                      {location.address.split(",").slice(0, 2).join(",")}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
            >
              Post Job
            </Button>
            <p className="text-xs text-center text-gray-400">
              Your job will be visible to nearby providers immediately. Premium
              providers see it first.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
