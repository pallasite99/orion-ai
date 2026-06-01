'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">ORION</h1>
        <p className="text-gray-400">Personal Intelligence Operating System</p>
      </div>

      {/* Command Center Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Central ORION Core */}
        <div className="lg:col-span-1 md:col-span-2 lg:row-span-2">
          <div className="relative h-64 rounded-lg border border-gray-700 bg-gray-950 flex items-center justify-center overflow-hidden">
            {/* Pulsing Orb */}
            <div className="relative w-32 h-32">
              {/* Outer rings */}
              <div className="absolute inset-0 rounded-full border border-cyan-500 animate-pulse"></div>
              <div className="absolute inset-2 rounded-full border border-cyan-400 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
              <div className="absolute inset-4 rounded-full border border-cyan-300 animate-[pulse_3s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>

              {/* Center glow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-transparent opacity-30 blur-xl"></div>

              {/* Center dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 bg-cyan-400 rounded-full"></div>
              </div>
            </div>

            {/* Corner text */}
            <div className="absolute top-4 left-4 text-xs text-gray-500">
              STATUS: READY
            </div>
            <div className="absolute bottom-4 right-4 text-xs text-gray-500">
              v0.1.0
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="rounded-lg border border-gray-700 bg-gray-950 p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">TODAY</h3>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-xs text-gray-500">Tasks due today</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-xs text-gray-500">Memories created</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border border-gray-700 bg-gray-950 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">ACTIONS</h3>
          <Link href="/chat">
            <Button variant="outline" className="w-full text-left">
              💬 Start Chat
            </Button>
          </Link>
          <Link href="/today">
            <Button variant="outline" className="w-full text-left">
              📅 Daily Briefing
            </Button>
          </Link>
          <Link href="/focus">
            <Button variant="outline" className="w-full text-left">
              🎯 Focus Mode
            </Button>
          </Link>
        </div>

        {/* Unread Messages */}
        <div className="rounded-lg border border-gray-700 bg-gray-950 p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">RECENT CHATS</h3>
          <p className="text-sm text-gray-500">No chats yet. Start a conversation.</p>
        </div>

        {/* Files */}
        <div className="rounded-lg border border-gray-700 bg-gray-950 p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">FILES</h3>
          <p className="text-sm text-gray-500">No files indexed.</p>
        </div>

        {/* System Status */}
        <div className="rounded-lg border border-gray-700 bg-gray-950 p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">SYSTEM</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">API Status</span>
              <span className="text-green-400">● Ready</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Database</span>
              <span className="text-green-400">● Connected</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">AI Model</span>
              <span className="text-yellow-400">● Initializing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="rounded-lg border border-gray-700 bg-gray-950 p-6">
        <h2 className="text-lg font-semibold mb-3">Welcome to ORION</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-4">
          ORION is your personal AI operating system. It helps you understand, organize,
          remember, and act across your digital life.
        </p>
        <ul className="text-sm text-gray-400 space-y-2 mb-6">
          <li>✓ Chat with an AI assistant trained on your context</li>
          <li>✓ Build long-term memory across conversations</li>
          <li>✓ Manage tasks, projects, and daily briefings</li>
          <li>✓ Upload and search your personal knowledge</li>
          <li>✓ Use voice input for hands-free interaction</li>
        </ul>
        <Link href="/chat">
          <Button className="bg-cyan-600 hover:bg-cyan-700 text-black font-semibold">
            Get Started →
          </Button>
        </Link>
      </div>
    </div>
  );
}
