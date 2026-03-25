export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#fff8f0] to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-2">
            <img src="/mykuya-logo.png" alt="mykuya" className="h-12 w-auto object-contain" />
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
