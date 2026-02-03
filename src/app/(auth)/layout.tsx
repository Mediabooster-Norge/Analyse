import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="p-4 sm:p-6">
        <Link href="/" className="flex flex-col gap-0.5 w-fit">
          <img 
            src="/mediabooster-logo-darkgrey.avif" 
            alt="Mediabooster" 
            className="h-5 sm:h-6 w-auto"
          />
          <span className="text-neutral-500 text-xs">Din digitale CMO</span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Mediabooster.</p>
      </footer>
    </div>
  );
}
