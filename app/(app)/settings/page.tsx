'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AI_PROVIDER } from '@/lib/ai/openai-client';
import { getAppSettings, getAutomationEvents } from '@/lib/mvp-store';
import { AutomationService } from '@/services/automation.service';
import { LearningService } from '@/services/learning.service';
import { DEFAULT_APP_SETTINGS } from '@/types/settings';
import type { AppSettings } from '@/types/settings';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(() => getAppSettings());
  const [activity, setActivity] = useState(() => getAutomationEvents().slice(0, 8));
  const [learning, setLearning] = useState(() => LearningService.getSummary());

  useEffect(() => {
    setSettings(getAppSettings());
    setActivity(getAutomationEvents().slice(0, 8));
    setLearning(LearningService.getSummary());
  }, []);

  const summaryCards = useMemo(
    () => [
      { label: 'Provider', value: AI_PROVIDER },
      { label: 'Theme', value: settings.theme ?? 'dark' },
      { label: 'Tone', value: settings.orion_tone ?? 'friendly' },
      { label: 'Timezone', value: settings.timezone ?? 'UTC' },
    ],
    [settings]
  );

  const commit = (patch: Partial<AppSettings>) => {
    const next = AutomationService.updateSettings(patch);
    setSettings(next);
    setActivity(getAutomationEvents().slice(0, 8));
    setLearning(LearningService.getSummary());
  };

  const reset = () => {
    const next = AutomationService.updateSettings(DEFAULT_APP_SETTINGS);
    setSettings(next);
    setActivity(getAutomationEvents().slice(0, 8));
    setLearning(LearningService.getSummary());
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-3">
        <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-cyan-200">
          Control center
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="max-w-3xl text-gray-400">
            Tune Orion&apos;s behavior, interaction style, and automation preferences from one place.
          </p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-3xl border border-gray-800 bg-gray-950/70 p-5">
            <div className="text-sm uppercase tracking-[0.25em] text-gray-500">{card.label}</div>
            <div className="mt-3 text-2xl font-semibold text-white">{card.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-gray-800 bg-gray-950/70 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Preferences</h2>
              <p className="mt-1 text-sm text-gray-400">
                These values are stored locally and mirrored through the automation layer.
              </p>
            </div>
            <Button variant="outline" onClick={reset}>
              Reset defaults
            </Button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <SettingSelect
              label="Theme"
              value={settings.theme ?? 'dark'}
              onChange={(value) => commit({ theme: value as AppSettings['theme'] })}
              options={['light', 'dark', 'auto']}
            />
            <SettingSelect
              label="Orion tone"
              value={settings.orion_tone ?? 'friendly'}
              onChange={(value) => commit({ orion_tone: value as AppSettings['orion_tone'] })}
              options={['formal', 'friendly', 'technical', 'casual']}
            />
            <SettingSelect
              label="Language"
              value={settings.language ?? 'en'}
              onChange={(value) => commit({ language: value })}
              options={['en', 'es', 'fr', 'de', 'hi']}
            />
            <SettingInput
              label="Timezone"
              value={settings.timezone ?? 'UTC'}
              onChange={(value) => commit({ timezone: value })}
              placeholder="UTC"
            />
          </div>

          <div className="mt-6 grid gap-3">
            <ToggleRow
              title="Voice enabled"
              description="Allow Orion to use voice features where supported."
              checked={settings.voice_enabled ?? false}
              onChange={(checked) => commit({ voice_enabled: checked })}
            />
            <ToggleRow
              title="Memory enabled"
              description="Let chat store and retrieve personal context."
              checked={settings.memory_enabled ?? true}
              onChange={(checked) => commit({ memory_enabled: checked })}
            />
            <ToggleRow
              title="Learning enabled"
              description="Let Orion convert feedback and good replies into reusable lessons."
              checked={settings.learning_enabled ?? true}
              onChange={(checked) => commit({ learning_enabled: checked })}
            />
            <ToggleRow
              title="Compact mode"
              description="Tighten spacing across the command center UI."
              checked={settings.compactMode}
              onChange={(checked) => commit({ compactMode: checked })}
            />
            <ToggleRow
              title="Sound"
              description="Prepare the app for future audio cues and notifications."
              checked={settings.soundEnabled}
              onChange={(checked) => commit({ soundEnabled: checked })}
            />
            <ToggleRow
              title="Auto-seed sample data"
              description="Restore demo content when local storage is empty."
              checked={settings.autoSeed}
              onChange={(checked) => commit({ autoSeed: checked })}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-800 bg-gradient-to-br from-gray-950 via-black to-gray-950 p-6">
            <h2 className="text-lg font-semibold text-white">Automation activity</h2>
            <p className="mt-1 text-sm text-gray-400">
              Recent setting changes and generated actions from the local automation layer.
            </p>

            <div className="mt-4 space-y-3">
              {activity.length ? (
                activity.map((event) => (
                  <article key={event.id} className="rounded-2xl border border-gray-800 bg-black/40 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium text-white">{event.title}</div>
                        <p className="mt-1 text-sm leading-6 text-gray-400">{event.details || event.action}</p>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${
                          event.status === 'success'
                            ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
                            : event.status === 'error'
                              ? 'border-red-400/20 bg-red-400/10 text-red-200'
                              : 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200'
                        }`}
                      >
                        {event.status}
                      </span>
                    </div>
                    <div className="mt-3 text-xs uppercase tracking-[0.25em] text-gray-500">
                      {new Date(event.created_at).toLocaleString()}
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState
                  title="No automation history"
                  description="Change a setting or create a task from chat to populate this log."
                />
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-800 bg-gray-950/70 p-6">
            <h2 className="text-lg font-semibold text-white">Active configuration</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <InfoRow label="AI provider" value={AI_PROVIDER} />
              <InfoRow label="Voice" value={settings.voice_enabled ? 'Enabled' : 'Disabled'} />
              <InfoRow label="Memory" value={settings.memory_enabled ? 'Enabled' : 'Disabled'} />
              <InfoRow label="Learning" value={settings.learning_enabled ? 'Enabled' : 'Disabled'} />
              <InfoRow label="Auto-seed" value={settings.autoSeed ? 'Enabled' : 'Disabled'} />
            </dl>
          </div>

          <div className="rounded-3xl border border-gray-800 bg-gray-950/70 p-6">
            <h2 className="text-lg font-semibold text-white">Learning log</h2>
            <p className="mt-1 text-sm text-gray-400">
              Feedback entries and lessons Orion has already retained.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Metric label="Feedback" value={learning.total_feedback} />
              <Metric label="Helpful" value={learning.helpful} />
              <Metric label="Needs work" value={learning.needs_work} />
            </div>

            <div className="mt-4 space-y-3">
              {learning.recent_feedback.length ? (
                learning.recent_feedback.map((entry) => (
                  <article key={entry.id} className="rounded-2xl border border-gray-800 bg-black/40 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-white">
                        {entry.rating === 'helpful' ? 'Helpful' : 'Needs work'}
                      </div>
                      <span className="text-xs uppercase tracking-[0.2em] text-gray-500">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-gray-400">
                      {entry.note || entry.user_message || 'Feedback recorded.'}
                    </p>
                  </article>
                ))
              ) : (
                <EmptyState
                  title="No feedback yet"
                  description="Use the chat feedback controls to teach Orion what worked."
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SettingSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <div className="text-sm uppercase tracking-[0.25em] text-gray-500">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-gray-800 bg-black/50 px-4 py-3 text-white outline-none transition-colors focus:border-cyan-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function SettingInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <div className="text-sm uppercase tracking-[0.25em] text-gray-500">{label}</div>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-gray-800 bg-black/50 px-4 py-3 text-white outline-none transition-colors placeholder:text-gray-600 focus:border-cyan-500"
      />
    </label>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-2xl border border-gray-800 bg-black/40 p-4">
      <div className="space-y-1">
        <div className="font-medium text-white">{title}</div>
        <div className="text-sm leading-6 text-gray-400">{description}</div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-5 accent-cyan-400"
      />
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-800 bg-black/40 px-4 py-3">
      <dt className="text-gray-400">{label}</dt>
      <dd className="font-medium text-white">{value}</dd>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-black/40 p-4">
      <div className="text-xs uppercase tracking-[0.25em] text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-800 bg-black/30 p-6 text-center">
      <div className="font-medium text-white">{title}</div>
      <div className="mt-1 text-sm text-gray-500">{description}</div>
    </div>
  );
}
