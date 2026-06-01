'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

const NAVIGATION = [
  { href: '/dashboard', label: 'Dashboard', icon: '◉' },
  { href: '/chat', label: 'Chat', icon: '💬' },
  { href: '/today', label: 'Today', icon: '📅' },
  { href: '/tasks', label: 'Tasks', icon: '✓' },
  { href: '/projects', label: 'Projects', icon: '📊' },
  { href: '/memory', label: 'Memory', icon: '🧠' },
  { href: '/files', label: 'Files', icon: '📁' },
  { href: '/search', label: 'Search', icon: '🔍' },
  { href: '/focus', label: 'Focus', icon: '🎯' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } border-r border-gray-800 bg-black flex flex-col transition-all duration-300`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold tracking-widest">
            {sidebarOpen ? 'ORION' : '◉'}
          </h1>
          <p className={`text-xs text-gray-500 ${!sidebarOpen && 'hidden'}`}>
            Command Center
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {NAVIGATION.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 ${
                    isActive
                      ? 'bg-gray-900 text-cyan-400 border border-gray-700'
                      : 'text-gray-400 hover:text-white hover:bg-gray-900'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {sidebarOpen && <span>{item.label}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Toggle Button */}
        <div className="p-4 border-t border-gray-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full"
          >
            {sidebarOpen ? '«' : '»'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-black">
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
              🔔
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400">
              👤
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-black">
          {children}
        </main>
      </div>
    </div>
  );
}
