import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

function looksLikePlaceholder(value: string | undefined) {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return normalized === '' || normalized.includes('your-') || normalized.includes('placeholder');
}

const useMockSupabase = !supabaseUrl || !supabaseAnonKey || looksLikePlaceholder(supabaseUrl) || looksLikePlaceholder(supabaseAnonKey);

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const mockData: Record<string, any[]> = {
  users: [
    {
      id: 'user-placeholder',
      email: 'you@placeholder.local',
      display_name: 'ORION User',
      avatar_url: '',
      preferences: {
        theme: 'dark',
        orion_tone: 'friendly',
        voice_enabled: false,
        memory_enabled: true,
        learning_enabled: true,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  chats: [],
  messages: [],
  memories: [
    {
      id: 'memory-1',
      user_id: 'user-placeholder',
      type: 'fact',
      title: 'MVP focus',
      content: 'Keep the first release centered on chat, tasks, memory, and daily planning.',
      tags: ['mvp', 'product'],
      source: 'seed',
      importance_score: 8,
      embedding: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'memory-2',
      user_id: 'user-placeholder',
      type: 'preference',
      title: 'UI direction',
      content: 'Use a dark command-center layout with cyan accent color.',
      tags: ['ui', 'theme'],
      source: 'seed',
      importance_score: 7,
      embedding: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'memory-3',
      user_id: 'user-placeholder',
      type: 'note',
      title: 'Chat style',
      content: 'Assistant responses should be short, structured, and easy to scan.',
      tags: ['chat', 'writing'],
      source: 'seed',
      importance_score: 6,
      embedding: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  tasks: [],
  projects: [],
  files: [],
  file_chunks: [],
  reminders: [],
  focus_sessions: [],
  automation_events: [
    {
      id: 'automation-event-1',
      user_id: 'user-placeholder',
      action: 'generate_task_list',
      status: 'info',
      title: 'Generated local task list',
      details: 'Seed automation activity is available for the demo.',
      created_at: new Date().toISOString(),
    },
  ],
  settings: [
    {
      compactMode: false,
      soundEnabled: true,
      autoSeed: true,
      theme: 'dark',
      orion_tone: 'friendly',
      voice_enabled: false,
      memory_enabled: true,
      learning_enabled: true,
      language: 'en',
      timezone: 'UTC',
    },
  ],
};

function createMockQuery(table: string) {
  const records = mockData[table] || [];
  const state: {
    table: string;
    filters: Array<(item: any) => boolean>;
    limitCount?: number;
    rangeStart?: number;
    rangeEnd?: number;
    orderField?: string;
    orderAsc: boolean;
    selectedColumns: string | string[];
    deleteMode: boolean;
  } = {
    table,
    filters: [] as Array<(item: any) => boolean>,
    limitCount: undefined,
    rangeStart: undefined,
    rangeEnd: undefined,
    orderField: undefined,
    orderAsc: true,
    selectedColumns: '*',
    deleteMode: false,
  };

  const applyFilters = (items: any[]) => {
    return state.filters.reduce((acc: any[], filter) => acc.filter(filter), items);
  };

  const makeResponse = (items: any[]) => {
    const selected = state.selectedColumns === '*' ? items : items.map((item) => {
      const output: any = {};
      for (const col of state.selectedColumns) {
        output[col] = item[col];
      }
      return output;
    });
    return { data: selected, error: null, count: selected.length };
  };

  const query: any = {
    select(columns?: string | string[], options?: any) {
      if (columns && columns !== '*') {
        state.selectedColumns = Array.isArray(columns) ? columns : columns.split(',').map((v) => v.trim()).filter(Boolean);
      }
      if (options?.count === 'exact') {
        // count will be returned in makeResponse
      }
      return query;
    },
    eq(column: string, value: any) {
      state.filters.push((item: any) => item[column] === value);
      return query;
    },
    order(column: string, { ascending }: { ascending: boolean }) {
      state.orderField = column;
      state.orderAsc = ascending;
      return query;
    },
    range(start: number, end: number) {
      state.rangeStart = start;
      state.rangeEnd = end;
      return query;
    },
    single() {
      const items = applyFilters(records);
      return Promise.resolve({ data: items[0] ?? null, error: null });
    },
    insert(rows: any[]) {
      const inserted = rows.map((row) => ({
        ...row,
        id: row.id ?? generateId(),
        created_at: row.created_at ?? new Date().toISOString(),
        updated_at: row.updated_at ?? new Date().toISOString(),
      }));
      records.push(...inserted);
      return {
        select() {
          return {
            single() {
              return Promise.resolve({ data: inserted[0] ?? null, error: null });
            },
            then(onFulfilled: (result: any) => any) {
              return Promise.resolve({ data: inserted, error: null }).then(onFulfilled);
            },
          };
        },
      };
    },
    update(changes: any) {
      const items = applyFilters(records);
      const updated = items.map((item) => {
        const merged = { ...item, ...changes, updated_at: new Date().toISOString() };
        const index = records.findIndex((r) => r.id === item.id);
        records[index] = merged;
        return merged;
      });
      return {
        select() {
          return {
            single() {
              return Promise.resolve({ data: updated[0] ?? null, error: null });
            },
            then(onFulfilled: (result: any) => any) {
              return Promise.resolve({ data: updated, error: null }).then(onFulfilled);
            },
          };
        },
      };
    },
    delete() {
      state.deleteMode = true;
      return query;
    },
    contains(column: string, values: any[]) {
      state.filters.push((item: any) => Array.isArray(item[column]) && values.every((value) => item[column].includes(value)));
      return query;
    },
    gte(column: string, value: any) {
      state.filters.push((item: any) => item[column] >= value);
      return query;
    },
    textSearch(column: string, phrase: string) {
      const normalized = phrase.toLowerCase();
      state.filters.push((item: any) => String(item[column] || '').toLowerCase().includes(normalized));
      return query;
    },
    limit(count: number) {
      state.limitCount = count;
      return query;
    },
    then(onFulfilled: (result: any) => any) {
      let items = applyFilters(records);
      if (state.orderField) {
        const orderKey = state.orderField as string;
        items = [...items].sort((a, b) => {
          const aVal = a[orderKey];
          const bVal = b[orderKey];
          if (aVal === bVal) return 0;
          if (aVal == null) return state.orderAsc ? 1 : -1;
          if (bVal == null) return state.orderAsc ? -1 : 1;
          return state.orderAsc ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
        });
      }
      if (state.rangeStart !== undefined && state.rangeEnd !== undefined) {
        items = items.slice(state.rangeStart, state.rangeEnd + 1);
      } else if (state.limitCount !== undefined) {
        items = items.slice(0, state.limitCount);
      }
      if (state.deleteMode) {
        for (const item of items) {
          const index = records.findIndex((r) => r.id === item.id);
          if (index !== -1) records.splice(index, 1);
        }
        state.deleteMode = false;
      }
      return Promise.resolve(makeResponse(items)).then(onFulfilled);
    },
  };

  return query;
}

function createMockAuth() {
  let session = {
    user: mockData.users[0],
    access_token: 'placeholder-token',
  };

  return {
    getUser: async () => ({ data: { user: session.user }, error: null }),
    getSession: async () => ({ data: { session }, error: null }),
    signOut: async () => {
      session = { user: null, access_token: null } as any;
      return { error: null };
    },
  };
}

const mockSupabaseClient = {
  from: (table: string) => createMockQuery(table),
  auth: createMockAuth(),
};

export const supabaseClient = useMockSupabase
  ? (mockSupabaseClient as any)
  : createClient(supabaseUrl!, supabaseAnonKey!);

export const supabaseAdmin = !useMockSupabase && supabaseServiceKey
  ? createClient(supabaseUrl!, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export async function getCurrentUser() {
  if (useMockSupabase) {
    const { data } = await supabaseClient.auth.getUser();
    return data.user;
  }
  const { data, error } = await supabaseClient.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function getCurrentSession() {
  if (useMockSupabase) {
    const { data } = await supabaseClient.auth.getSession();
    return data.session;
  }
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;
}
