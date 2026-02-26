"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { Button } from "@/views/components/shared/Button";
import { Input, Textarea, Select } from "@/views/components/shared/Input";
import { Card } from "@/views/components/shared/Card";
import { Badge } from "@/views/components/shared/Badge";
import { JOB_CATEGORIES, type JobCategory } from "@/types";
import { Upload, CheckCircle, AlertCircle, X, ChevronLeft } from "lucide-react";

const STEPS = ["ID Verification", "Skills & Rate", "Done"] as const;

const ALL_SKILLS = Object.entries(JOB_CATEGORIES).map(([key, meta]) => ({
  key: key as JobCategory,
  ...meta,
}));

export default function ProviderOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [parsedName, setParsedName] = useState("");
  const [parsedAddress, setParsedAddress] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrDone, setOcrDone] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<JobCategory[]>([]);
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIdFile(file);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setIdPreview(dataUrl);
      // Try OCR
      setOcrLoading(true);
      try {
        const base64 = dataUrl.split(",")[1];
        const res = await fetch("/api/id-parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 }),
        });
        const { data } = await res.json();
        if (data?.success) {
          setParsedName(data.name);
          setParsedAddress(data.address);
          toast.success("ID parsed successfully!");
        } else {
          toast.info("Could not auto-read ID — please fill in manually below.");
        }
      } finally {
        setOcrLoading(false);
        setOcrDone(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitStep1 = async () => {
    if (!idFile) {
      toast.error("Please upload your government ID");
      return;
    }
    setStep(1);
  };

  const handleFinalSubmit = async () => {
    if (selectedSkills.length === 0) {
      toast.error("Select at least one skill");
      return;
    }
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload ID photo to Supabase Storage
      let idPhotoUrl = "";
      if (idFile) {
        const filePath = `ids/${user.id}/${Date.now()}_${idFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("provider-ids")
          .upload(filePath, idFile, { upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("provider-ids")
            .getPublicUrl(filePath);
          idPhotoUrl = urlData.publicUrl;
        }
      }

      // Upsert provider profile
      await supabase.from("providers").upsert({
        id: user.id,
        skills: selectedSkills,
        bio,
        hourly_rate: hourlyRate ? parseInt(hourlyRate) : null,
        id_photo_url: idPhotoUrl,
        id_parsed_name: parsedName,
        id_parsed_address: parsedAddress,
        id_verified: !!parsedName,
        is_available: true,
      });

      setStep(2);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save profile",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = (skill: JobCategory) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        {step > 0 && step < 2 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="p-2 rounded-xl hover:bg-slate-100 -ml-2"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
        )}
        <div>
          <h1 className="font-bold text-slate-900">
            Set Up Your Provider Profile
          </h1>
          <p className="text-xs text-slate-500">
            {STEPS[step]} · Step {step + 1} of {STEPS.length}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Step 0: ID Verification */}
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <Card className="bg-indigo-50 border-indigo-100">
            <p className="text-sm font-medium text-indigo-800">
              🪪 Why do we need your ID?
            </p>
            <p className="text-xs text-indigo-600 mt-1">
              Government ID verification builds trust with clients. Your ID is
              stored securely and never shared publicly.
            </p>
          </Card>

          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={handleIdUpload}
            />
            {idPreview ? (
              <div className="relative">
                <img
                  src={idPreview}
                  alt="ID preview"
                  className="w-full rounded-xl border border-slate-200 object-cover max-h-48"
                />
                <button
                  onClick={() => {
                    setIdFile(null);
                    setIdPreview(null);
                    setOcrDone(false);
                  }}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm border border-slate-200"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
                {ocrLoading && (
                  <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                    <div className="bg-white rounded-xl px-4 py-3 text-sm font-medium text-slate-700">
                      Scanning ID...
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center gap-3 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
              >
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                  <Upload className="w-6 h-6 text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-slate-700">
                    Upload Government ID
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    SSS, UMID, PhilHealth, Postal, Voter&apos;s ID
                  </p>
                </div>
              </button>
            )}
          </div>

          {ocrDone && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm">
                {parsedName ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                )}
                <span className="text-slate-600">
                  {parsedName
                    ? "ID auto-filled — confirm below"
                    : "Fill in details manually"}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">
                    Full name (from ID)
                  </label>
                  <input
                    value={parsedName}
                    onChange={(e) => setParsedName(e.target.value)}
                    placeholder="Juan dela Cruz"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">
                    Address (from ID)
                  </label>
                  <input
                    value={parsedAddress}
                    onChange={(e) => setParsedAddress(e.target.value)}
                    placeholder="123 Street, Barangay, Quezon City"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmitStep1}
            fullWidth
            size="lg"
            disabled={!idFile || ocrLoading}
          >
            {ocrLoading ? "Scanning..." : "Continue"}
          </Button>
        </div>
      )}

      {/* Step 1: Skills & Rate */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-semibold text-slate-900">
              What services do you offer?
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select all that apply — you&apos;ll only see matching jobs
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {ALL_SKILLS.map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleSkill(key)}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border-2 transition-all ${
                  selectedSkills.includes(key)
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-100 bg-white hover:border-indigo-200"
                }`}
              >
                <span className="text-2xl">{icon}</span>
                <span className="text-xs font-medium text-slate-700 text-center leading-tight">
                  {label}
                </span>
                {selectedSkills.includes(key) && (
                  <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
                    <span className="text-white text-[10px]">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {selectedSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedSkills.map((s) => (
                <Badge key={s} variant="info">
                  {JOB_CATEGORIES[s].icon} {JOB_CATEGORIES[s].label}
                </Badge>
              ))}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">
              Short bio (optional)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Licensed plumber with 10 years experience in QC. Specializing in leaks, pipes, and installations."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <Input
            label="Hourly rate (₱) — optional"
            type="number"
            placeholder="e.g. 250"
            hint="Clients will see this on your profile"
            value={hourlyRate}
            min="0" // Prevents the stepper arrows
            onKeyDown={(e) => {
              // If user hits "-", "e", or "E", stop the event immediately
              if (e.key === "-" || e.key === "e" || e.key === "E") {
                e.preventDefault();
              }
            }}
            onChange={(e) => {
              const val = e.target.value;

              // 1. Allow empty string so users can backspace/clear the input
              if (val === "") {
                setHourlyRate("");
                return;
              }

              // 2. Convert to number, get Absolute value, then back to string for the state
              const positiveValue = Math.abs(Number(val));
              setHourlyRate(String(positiveValue));
            }}
          />

          <Button
            onClick={handleFinalSubmit}
            loading={loading}
            fullWidth
            size="lg"
            disabled={selectedSkills.length === 0}
          >
            Complete Setup
          </Button>
        </div>
      )}

      {/* Step 2: Done */}
      {step === 2 && (
        <div className="flex flex-col items-center gap-6 py-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              You&apos;re all set! 🎉
            </h2>
            <p className="text-slate-500 text-sm mt-2 max-w-xs">
              Your provider profile is live. Toggle availability to start
              receiving job requests in your area.
            </p>
          </div>
          <Card className="w-full bg-indigo-50 border-indigo-100 text-left">
            <p className="text-sm font-semibold text-indigo-800 mb-2">
              What happens next?
            </p>
            <ul className="text-xs text-indigo-700 space-y-1.5">
              <li>✅ Your profile is visible to nearby clients</li>
              <li>🔔 You&apos;ll get notified when matching jobs are posted</li>
              <li>⚡ Upgrade to Premium to see jobs 4 minutes earlier</li>
              <li>⭐ Build your rating by completing jobs reliably</li>
            </ul>
          </Card>
          <Button
            onClick={() => router.push("/provider/dashboard")}
            fullWidth
            size="lg"
          >
            Go to my Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}
