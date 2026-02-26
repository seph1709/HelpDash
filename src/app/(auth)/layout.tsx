export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-lg font-bold">H</span>
            </div>
            <span className="text-xl font-bold text-slate-900">HelpDash</span>
          </div>
          <p className="text-sm text-slate-500">
            Trusted local services, 2km away
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
