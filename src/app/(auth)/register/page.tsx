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
import { Home, Wrench, Zap } from "lucide-react";

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
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          lat: location?.lat,
          lng: location?.lng,
          barangay: location?.address,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Registration failed");

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
                i <= stepIndex
                  ? "bg-[#1677ff] text-white"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {i < stepIndex ? "✓" : i + 1}
            </div>
            <span
              className={`text-xs font-medium ${i === stepIndex ? "text-[#1677ff]" : "text-gray-400"}`}
            >
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px bg-[#f0f0f0]" />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Step 1: Account */}
        {step === "Account" && (
          <>
            <h2 className="font-semibold text-gray-900">
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
            <h2 className="font-semibold text-gray-900">
              How will you use HelpDash?
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  value: "client",
                  label: "I need services",
                  desc: "Post jobs and hire local providers",
                  Icon: Home,
                },
                {
                  value: "provider",
                  label: "I offer services",
                  desc: "Find clients and earn from gigs",
                  Icon: Wrench,
                },
                {
                  value: "both",
                  label: "Both",
                  desc: "Post jobs and offer services",
                  Icon: Zap,
                },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                    role === option.value
                      ? "border-[#1677ff] bg-[#e6f4ff]"
                      : "border-[#f0f0f0] hover:border-[#91caff]"
                  }`}
                >
                  <input
                    type="radio"
                    value={option.value}
                    className="sr-only"
                    {...register("role")}
                  />
                  <span className="w-10 h-10 rounded-lg bg-[#e6f4ff] flex items-center justify-center flex-shrink-0">
                    <option.Icon className="w-5 h-5 text-[#1677ff]" />
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {option.label}
                    </p>
                    <p className="text-xs text-gray-400">{option.desc}</p>
                  </div>
                </label>
              ))}
            </div>
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
            <h2 className="font-semibold text-gray-900">
              Pin your home location
            </h2>
            <p className="text-sm text-gray-400">
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
              <p className="text-xs text-[#faad14] text-center">
                Please pin your location on the map first
              </p>
            )}
          </>
        )}
      </form>

      <p className="text-center text-sm text-gray-400 mt-4">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[#1677ff] font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </Card>
  );
}
