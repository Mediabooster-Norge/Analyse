'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TooltipProvider } from '@/components/ui/tooltip';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Analyser', href: '/analysis', icon: BarChart3 },
  { name: 'Mine artikler', href: '/dashboard/articles', icon: FileText },
  { name: 'Innstillinger', href: '/settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white">
      {/* Logo */}
      <Link href="/" className="flex items-center h-20 px-5 border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
        <img src="/logo.svg" alt="Booster" className="h-9 w-auto object-contain brightness-0" />
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-neutral-100 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 px-3 py-3 h-auto rounded-xl hover:bg-neutral-50">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-neutral-100 text-neutral-700 text-sm font-semibold">
                  U
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-neutral-900">Min konto</p>
                <p className="text-xs text-neutral-400">Administrer profil</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            <DropdownMenuLabel>Min konto</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="rounded-lg">
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Innstillinger
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600 rounded-lg">
              <LogOut className="mr-2 h-4 w-4" />
              Logg ut
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={0}>
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 flex h-14 min-[450px]:h-16 items-center gap-2 min-[450px]:gap-4 border-b border-neutral-100 bg-white px-3 min-[450px]:px-4">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-neutral-100 rounded-xl h-9 w-9 min-[450px]:h-10 min-[450px]:w-10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(280px,100vw-2rem)] p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <Link href="/" className="flex items-center min-w-0 flex-1">
          <img src="/logo.svg" alt="Booster" className="h-7 max-[400px]:h-6 min-[450px]:h-8 w-auto object-contain brightness-0" />
        </Link>
      </header>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-neutral-100 bg-white">
          <SidebarContent />
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:pl-64 min-w-0">
          <div className="p-3 max-[400px]:p-3 min-[401px]:p-4 min-[450px]:p-5 sm:p-6 lg:p-10">
            <div className="max-w-5xl mx-auto w-full min-w-0">{children}</div>
          </div>
        </main>
      </div>
    </div>
    </TooltipProvider>
  );
}
