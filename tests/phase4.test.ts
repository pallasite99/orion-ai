import { beforeEach, describe, expect, it } from 'vitest';
import { supabaseClient } from '@/lib/db/supabase-client';
import { buildFileSnippet, chunkText, FileService } from '@/services/file.service';
import { SearchService } from '@/services/search.service';

async function resetTables() {
  await supabaseClient.from('file_chunks').delete();
  await supabaseClient.from('files').delete();
  await supabaseClient.from('tasks').delete();
  await supabaseClient.from('memories').delete();
  await supabaseClient.from('projects').delete();
}

describe('Phase 4 file and search services', () => {
  beforeEach(async () => {
    await resetTables();
  });

  it('chunks text with overlap and builds targeted snippets', () => {
    const text = Array.from({ length: 260 }, (_, index) => `word${index}`).join(' ');
    const chunks = chunkText(text, 120, 20);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].length).toBeLessThanOrEqual(120);

    const snippet = buildFileSnippet('Alpha beta gamma delta epsilon zeta eta theta', 'gamma');
    expect(snippet).toContain('gamma');
  });

  it('ingests a file, creates chunks, and answers questions from file context', async () => {
    const file = await FileService.ingestFile('user-placeholder', {
      name: 'Orion Guide',
      file_type: 'markdown',
      storage_url: 'local://orion-guide.md',
      extracted_text: 'ORION uses a dark command center with cyan accents. Tasks are prioritized by urgency.',
    });

    const chunks = await FileService.getFileChunks(file.id);
    expect(chunks.length).toBeGreaterThan(0);

    const answer = await FileService.answerQuestion(file.id, 'What visual style is described?');
    expect(answer.source_chunks.length).toBeGreaterThan(0);
    expect(answer.answer.toLowerCase()).toContain('cyan accents');
  });

  it('searches across tasks, memories, projects, and files', async () => {
    await supabaseClient.from('tasks').insert([
      {
        user_id: 'user-placeholder',
        title: 'Deploy the dashboard',
        description: 'Prepare the deployment checklist',
        status: 'todo',
        priority: 5,
      },
    ]);
    await supabaseClient.from('memories').insert([
      {
        user_id: 'user-placeholder',
        type: 'fact',
        title: 'Deployment note',
        content: 'The release process should be reviewed before shipping.',
        tags: ['release'],
        source: 'test',
        importance_score: 8,
      },
    ]);
    await supabaseClient.from('projects').insert([
      {
        user_id: 'user-placeholder',
        name: 'Deployment Sprint',
        description: 'Ship the current release safely.',
        status: 'active',
      },
    ]);
    await FileService.ingestFile('user-placeholder', {
      name: 'Deployment guide',
      file_type: 'txt',
      storage_url: 'local://deployment-guide.txt',
      extracted_text: 'Deployment steps and release checklists live here.',
    });

    const results = await SearchService.search('deploy', 5);

    expect(results.tasks.length).toBeGreaterThan(0);
    expect(results.memories.length).toBeGreaterThan(0);
    expect(results.projects.length).toBeGreaterThan(0);
    expect(results.files.length).toBeGreaterThan(0);
  });
});
