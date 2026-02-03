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
        <Link href="/" className="flex items-center w-fit">
          <img src="/logo.svg" alt="Mediabooster" className="h-6 sm:h-7 w-auto brightness-0" />
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
