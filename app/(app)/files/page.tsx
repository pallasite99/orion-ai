'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { APIResponse } from '@/types/api';
import type { FileChunk, FileRecord, FileType } from '@/types/file';

type UploadState = {
  name: string;
  storage_url: string;
  file_type: FileType;
  extracted_text: string;
};

const FILE_TYPES: FileType[] = ['pdf', 'txt', 'markdown'];

export default function FilesPage() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [query, setQuery] = useState('');
  const [selectedFileId, setSelectedFileId] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string>('');
  const [sourceChunks, setSourceChunks] = useState<FileChunk[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<UploadState>({
    name: '',
    storage_url: '',
    file_type: 'markdown',
    extracted_text: '',
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/files', { cache: 'no-store' });
      const payload = (await response.json()) as APIResponse<{ files: FileRecord[] }>;
      const data = payload.data;
      if (!response.ok || !payload.success || !data) {
        throw new Error(payload.message || 'Failed to load files.');
      }
      setFiles(data.files);
      setSelectedFileId((current) => current || data.files[0]?.id || '');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const filteredFiles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return files;
    return files.filter(
      (file) =>
        file.name.toLowerCase().includes(normalized) ||
        file.file_type.toLowerCase().includes(normalized) ||
        file.storage_url.toLowerCase().includes(normalized) ||
        (file.extracted_text || '').toLowerCase().includes(normalized)
    );
  }, [files, query]);

  const stats = [
    { label: 'Files', value: files.length },
    { label: 'Ready', value: files.filter((file) => file.status === 'ready').length },
    { label: 'Processing', value: files.filter((file) => file.status === 'processing').length },
    {
      label: 'With text',
      value: files.filter((file) => (file.extracted_text || '').trim().length > 0).length,
    },
  ];

  const extractTextFromUpload = async (file: File): Promise<{ file_type: FileType; text: string }> => {
    const lower = file.name.toLowerCase();
    if (file.type === 'application/pdf' || lower.endsWith('.pdf')) {
      try {
        const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
        GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const content = await page.getTextContent();
          text += `${content.items.map((item: any) => ('str' in item ? item.str : '')).join(' ')}\n`;
        }
        return { file_type: 'pdf', text: text.trim() };
      } catch {
        return { file_type: 'pdf', text: '' };
      }
    }

    const text = await file.text();
    const inferredType: FileType = lower.endsWith('.md') || lower.endsWith('.markdown') ? 'markdown' : 'txt';
    return { file_type: inferredType, text };
  };

  const handleSelectedFile = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      const { file_type, text } = await extractTextFromUpload(file);
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: file.name,
          storage_url: `uploaded://${file.name}`,
          file_type,
          extracted_text: text,
        }),
      });
      const payload = (await response.json()) as APIResponse<{ file: FileRecord }>;
      const data = payload.data;
      if (!response.ok || !payload.success || !data) {
        throw new Error(payload.message || 'Failed to upload file.');
      }

      setForm({
        name: '',
        storage_url: '',
        file_type: 'markdown',
        extracted_text: '',
      });
      setSelectedFileId(data.file.id);
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to upload file.');
    } finally {
      setUploading(false);
    }
  };

  const handleManualUpload = async () => {
    if (!form.name.trim() || !form.storage_url.trim()) return;
    setUploading(true);
    setError(null);
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          storage_url: form.storage_url.trim(),
          file_type: form.file_type,
          extracted_text: form.extracted_text.trim(),
        }),
      });
      const payload = (await response.json()) as APIResponse<{ file: FileRecord }>;
      const data = payload.data;
      if (!response.ok || !payload.success || !data) {
        throw new Error(payload.message || 'Failed to create file.');
      }
      setSelectedFileId(data.file.id);
      setForm({
        name: '',
        storage_url: '',
        file_type: 'markdown',
        extracted_text: '',
      });
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to add file.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (file: FileRecord) => {
    setError(null);
    try {
      const response = await fetch(`/api/files/${file.id}`, { method: 'DELETE' });
      const payload = (await response.json()) as APIResponse<{ deleted: boolean }>;
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to delete file.');
      }
      if (selectedFileId === file.id) {
        setSelectedFileId('');
      }
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete file.');
    }
  };

  const handleQuestion = async () => {
    if (!selectedFileId || !question.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const response = await fetch(`/api/files/${selectedFileId}/question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question.trim() }),
      });
      const payload = (await response.json()) as APIResponse<{ answer: string; source_chunks: FileChunk[]; confidence: number }>;
      const data = payload.data;
      if (!response.ok || !payload.success || !data) {
        throw new Error(payload.message || 'Failed to answer question.');
      }
      setAnswer(data.answer);
      setSourceChunks(data.source_chunks);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to answer question.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-white">Files</h1>
        <p className="text-gray-400 max-w-2xl">
          Upload documents, extract text, and ask ORION questions grounded in your files.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
            <div className="text-sm uppercase tracking-[0.25em] text-gray-500">{stat.label}</div>
            <div className="mt-3 text-3xl font-semibold text-white">{stat.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <div
            className={`rounded-3xl border border-dashed p-5 transition-colors ${
              dragActive ? 'border-cyan-400 bg-cyan-400/10' : 'border-gray-800 bg-gray-950/70'
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={async (event) => {
              event.preventDefault();
              setDragActive(false);
              const file = event.dataTransfer.files?.[0];
              if (file) {
                await handleSelectedFile(file);
              }
            }}
          >
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Upload file</h2>
                <p className="text-sm text-gray-500">
                  Drag and drop a PDF, TXT, or Markdown file.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    await handleSelectedFile(file);
                  }
                  event.currentTarget.value = '';
                }}
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  className="bg-cyan-400 text-black hover:bg-cyan-300"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Choose file'}
                </Button>
                <Button variant="outline" type="button" onClick={() => fileInputRef.current?.click()}>
                  Browse
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-800 bg-gray-950/70 p-5">
            <h2 className="text-lg font-semibold text-white">Manual file reference</h2>
            <div className="mt-4 space-y-3">
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="File name"
                className="w-full rounded-xl border border-gray-800 bg-black/50 px-4 py-3 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none"
              />
              <select
                value={form.file_type}
                onChange={(e) => setForm((prev) => ({ ...prev, file_type: e.target.value as FileType }))}
                className="w-full rounded-xl border border-gray-800 bg-black/50 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
              >
                {FILE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <input
                value={form.storage_url}
                onChange={(e) => setForm((prev) => ({ ...prev, storage_url: e.target.value }))}
                placeholder="Storage URL or local path"
                className="w-full rounded-xl border border-gray-800 bg-black/50 px-4 py-3 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none"
              />
              <textarea
                value={form.extracted_text}
                onChange={(e) => setForm((prev) => ({ ...prev, extracted_text: e.target.value }))}
                placeholder="Extracted text / notes"
                rows={5}
                className="w-full rounded-xl border border-gray-800 bg-black/50 px-4 py-3 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none"
              />
              <Button
                onClick={handleManualUpload}
                className="w-full bg-cyan-400 text-black hover:bg-cyan-300"
                disabled={uploading}
              >
                Save file reference
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-800 bg-gray-950/70 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">File question</h2>
              <span className="text-xs uppercase tracking-[0.25em] text-cyan-300">Q&A</span>
            </div>
            <div className="mt-4 space-y-3">
              <select
                value={selectedFileId}
                onChange={(e) => setSelectedFileId(e.target.value)}
                className="w-full rounded-xl border border-gray-800 bg-black/50 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="">Select a file</option>
                {files.map((file) => (
                  <option key={file.id} value={file.id}>
                    {file.name}
                  </option>
                ))}
              </select>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about the selected file"
                rows={4}
                className="w-full rounded-xl border border-gray-800 bg-black/50 px-4 py-3 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none"
              />
              <Button
                onClick={handleQuestion}
                className="w-full bg-cyan-400 text-black hover:bg-cyan-300"
                disabled={searching || !selectedFileId || !question.trim()}
              >
                {searching ? 'Thinking...' : 'Ask file'}
              </Button>
              {answer ? (
                <div className="rounded-2xl border border-gray-800 bg-black/40 p-4">
                  <div className="text-xs uppercase tracking-[0.25em] text-cyan-300">Answer</div>
                  <p className="mt-3 text-sm leading-6 text-gray-300">{answer}</p>
                  {sourceChunks.length ? (
                    <div className="mt-4 space-y-2">
                      <div className="text-xs uppercase tracking-[0.25em] text-gray-500">Sources</div>
                      {sourceChunks.map((chunk) => (
                        <div key={chunk.id} className="rounded-xl border border-gray-800 bg-black/30 p-3 text-sm text-gray-400">
                          {chunk.content}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-800 bg-gray-950/70 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-white">File index</h2>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files"
              className="w-full rounded-xl border border-gray-800 bg-black/50 px-4 py-3 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none md:w-64"
            />
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <EmptyState title="Loading files..." description="Fetching your file index." />
            ) : filteredFiles.length ? (
              filteredFiles.map((file) => (
                <article key={file.id} className="rounded-2xl border border-gray-800 bg-black/40 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-medium text-white">{file.name}</h3>
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
                          {file.file_type}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gray-300">
                          {file.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{file.storage_url}</p>
                      <p className="text-sm leading-6 text-gray-400">
                        {file.extracted_text || 'No extracted text yet.'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFileId(file.id)}
                      >
                        Ask
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => void handleDelete(file)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState title="No files found" description="Upload a document to populate the index." />
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
