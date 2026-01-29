import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link href="/" className="flex items-center gap-3 w-fit">
          <img 
            src="/mediabooster-logo-darkgrey.avif" 
            alt="Mediabooster" 
            className="h-8 w-auto"
          />
          <span className="font-bold text-xl">Nettsjekk</span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Nettsjekk. Utviklet av Mediabooster.</p>
      </footer>
    </div>
  );
}
