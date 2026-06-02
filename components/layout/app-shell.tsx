'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

const NAVIGATION = [
  { href: '/', label: 'Dashboard', icon: '◎' },
  { href: '/chat', label: 'Chat', icon: 'C' },
  { href: '/today', label: 'Today', icon: 'T' },
  { href: '/tasks', label: 'Tasks', icon: '✓' },
  { href: '/projects', label: 'Projects', icon: 'P' },
  { href: '/memory', label: 'Memory', icon: 'M' },
  { href: '/files', label: 'Files', icon: 'F' },
  { href: '/search', label: 'Search', icon: 'S' },
  { href: '/inbox', label: 'Inbox', icon: 'I' },
  { href: '/focus', label: 'Focus', icon: 'O' },
  { href: '/learning', label: 'Learning', icon: 'L' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  return (
    <div className="flex h-screen bg-black">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } flex flex-col border-r border-gray-800 bg-black transition-all duration-300`}
      >
        <div className="border-b border-gray-800 p-6">
          <h1 className="text-2xl font-bold tracking-widest">{sidebarOpen ? 'ORION' : '◎'}</h1>
          <p className={`text-xs text-gray-500 ${!sidebarOpen && 'hidden'}`}>Command Center</p>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {NAVIGATION.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 ${
                    isActive
                      ? 'border border-gray-700 bg-gray-900 text-cyan-400'
                      : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {sidebarOpen && <span>{item.label}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-800 p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full"
          >
            {sidebarOpen ? '<<' : '>>'}
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-gray-800 bg-black px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-200">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-gray-400">
              !
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400">
              @
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-black p-6">{children}</main>
      </div>
    </div>
  );
}
