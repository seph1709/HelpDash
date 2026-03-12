export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#1677ff] flex items-center justify-center">
              <span className="text-white text-lg font-bold">H</span>
            </div>
            <span className="text-xl font-bold text-gray-900">HelpDash</span>
          </div>
          <p className="text-sm text-gray-400">
            Trusted local services, 2km away
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
