"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { Button } from "@/views/components/shared/Button";
import { Input, Select } from "@/views/components/shared/Input";
import { Card } from "@/views/components/shared/Card";
import { LocationPicker } from "@/views/components/map/LocationPicker";
import { BARANGAYS_QC } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["client", "provider", "both"]),
});
type FormData = z.infer<typeof schema>;

const STEPS = ["Account", "Role", "Location"] as const;
type Step = (typeof STEPS)[number];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("Account");
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
    formState: { errors },
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { role: "client" },
  });

  const role = watch("role");

  const goNext = async () => {
    if (step === "Account") {
      const valid = await trigger(["name", "email", "password"]);
      if (valid) setStep("Role");
    } else if (step === "Role") {
      const valid = await trigger(["role"]);
      if (valid) setStep("Location");
    }
  };

  const onSubmit = async (data: FormData) => {
    console.log(data);

    setLoading(true);
    try {
      // Call API route which uses the service-role client (bypasses RLS)
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          lat: location?.lat,
          lng: location?.lng,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Registration failed");

      // Sign the user in client-side after the account is created
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (signInError) throw new Error(signInError.message);

      toast.success("Account created! Welcome to HelpDash.");

      if (data.role === "provider" || data.role === "both") {
        router.push("/provider/onboarding");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = STEPS.indexOf(step);

  return (
    <Card>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                i < stepIndex
                  ? "bg-indigo-600 text-white"
                  : i === stepIndex
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {i < stepIndex ? "✓" : i + 1}
            </div>
            <span
              className={`text-xs font-medium ${i === stepIndex ? "text-indigo-600" : "text-slate-400"}`}
            >
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px bg-slate-100" />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Step 1: Account */}
        {step === "Account" && (
          <>
            <h2 className="font-semibold text-slate-900">
              Create your account
            </h2>
            <Input
              label="Full name"
              placeholder="Juan dela Cruz"
              required
              error={errors.name?.message}
              {...register("name")}
            />
            <Input
              label="Email"
              type="email"
              placeholder="juan@email.com"
              required
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              required
              error={errors.password?.message}
              {...register("password")}
            />
            <Button type="button" onClick={goNext} fullWidth size="lg">
              Continue
            </Button>
          </>
        )}

        {/* Step 2: Role */}
        {step === "Role" && (
          <>
            <h2 className="font-semibold text-slate-900">
              How will you use HelpDash?
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  value: "client",
                  label: "I need services",
                  desc: "Post jobs and hire local providers",
                  icon: "🏠",
                },
                {
                  value: "provider",
                  label: "I offer services",
                  desc: "Find clients and earn from gigs",
                  icon: "🔧",
                },
                {
                  value: "both",
                  label: "Both",
                  desc: "Post jobs and offer services",
                  icon: "⚡",
                },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    role === option.value
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    value={option.value}
                    className="sr-only"
                    {...register("role")}
                  />
                  <span className="text-2xl">{option.icon}</span>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">
                      {option.label}
                    </p>
                    <p className="text-xs text-slate-500">{option.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            {/* <Select
              label="Your barangay"
              required
              error={errors.barangay?.message}
              options={[
                { value: "", label: "Select barangay..." },
                ...BARANGAYS_QC.map((b) => ({ value: b, label: b })),
              ]}
              {...register("barangay")}
            /> */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("Account")}
                size="lg"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={goNext}
                size="lg"
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Location */}
        {step === "Location" && (
          <>
            <h2 className="font-semibold text-slate-900">
              Pin your home location
            </h2>
            <p className="text-sm text-slate-500">
              Tap the map or drag the pin to set your location. This helps match
              you with nearby providers.
            </p>
            <LocationPicker
              onLocationSelect={(lat, lng, address) =>
                setLocation({ lat, lng, address })
              }
              height="250px"
              showRadius
            />
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("Role")}
                size="lg"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                loading={loading}
                size="lg"
                className="flex-1"
                disabled={!location}
              >
                Create account
              </Button>
            </div>
            {!location && (
              <p className="text-xs text-amber-600 text-center">
                Please pin your location on the map first
              </p>
            )}
          </>
        )}
      </form>

      <p className="text-center text-sm text-slate-500 mt-4">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-indigo-600 font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </Card>
  );
}
