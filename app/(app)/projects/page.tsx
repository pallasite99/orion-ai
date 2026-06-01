'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { seedLocalData } from '@/lib/mvp-store';
import { TaskService } from '@/services/task.service';
import type { Project } from '@/types/task';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const refresh = () => setProjects(TaskService.getProjects());

  useEffect(() => {
    seedLocalData();
    refresh();
  }, []);

  const addProject = () => {
    if (!name.trim()) return;
    TaskService.createProject(name.trim(), description.trim() || undefined);
    setName('');
    setDescription('');
    refresh();
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="text-gray-400 max-w-2xl">
          Create and track active workstreams without leaving the app.
        </p>
      </div>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-gray-800 bg-gray-950/70 p-5">
          <h2 className="text-lg font-semibold text-white">Add project</h2>
          <div className="mt-4 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className="w-full rounded-xl border border-gray-800 bg-black/50 px-4 py-3 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project description"
              rows={5}
              className="w-full rounded-xl border border-gray-800 bg-black/50 px-4 py-3 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none"
            />
            <Button onClick={addProject} className="w-full bg-cyan-400 text-black hover:bg-cyan-300">
              Create project
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-800 bg-gray-950/70 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Project list</h2>
            <span className="text-sm text-gray-500">{projects.length}</span>
          </div>
          <div className="mt-4 space-y-3">
            {projects.length ? (
              projects.map((project) => (
                <article key={project.id} className="rounded-2xl border border-gray-800 bg-black/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">{project.name}</div>
                      <p className="mt-1 text-sm leading-6 text-gray-400">
                        {project.description || 'No description'}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gray-300">
                      {project.status}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState title="No projects yet" description="Create your first project to start organizing work." />
            )}
          </div>
        </div>
      </section>
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
