import { ApiRepository } from './ApiRepository';
import { LocalMockRepository } from './LocalMockRepository';
import type { TrendMapRepository } from './TrendMapRepository';

const apiRepository = new ApiRepository();
const localRepository = new LocalMockRepository();

// @ts-ignore
const env = typeof import.meta !== 'undefined' ? (import.meta as any).env : {};
const isTest = env?.MODE === 'test';
const forceApi = env?.VITE_USE_API === 'true';
const forceLocal = env?.VITE_USE_API === 'false';

let resolvedRepository: TrendMapRepository | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => globalThis.setTimeout(resolve, ms));
}

async function backendIsReachable(attempts = 1): Promise<boolean> {
  if (typeof fetch === 'undefined') return false;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeout = controller ? globalThis.setTimeout(() => controller.abort(), 2500) : null;
    try {
      const response = await fetch('/api/version', {
        method: 'GET',
        signal: controller?.signal,
      });
      if (response.ok) return true;
    } catch {
      // Retry below before falling back to browser storage.
    } finally {
      if (timeout) globalThis.clearTimeout(timeout);
    }

    if (attempt < attempts - 1) {
      await sleep(350);
    }
  }

  return false;
}

async function resolveRepository(): Promise<TrendMapRepository> {
  if (forceApi) return apiRepository;
  if (forceLocal || isTest) return localRepository;
  if (resolvedRepository) return resolvedRepository;

  if (await backendIsReachable(3)) {
    resolvedRepository = apiRepository;
    return resolvedRepository;
  }

  return localRepository;
}

export async function getRepositoryMode(): Promise<'api' | 'local'> {
  if (forceApi) return 'api';
  if (forceLocal || isTest) return 'local';
  if (resolvedRepository === apiRepository) return 'api';
  return (await backendIsReachable(3)) ? 'api' : 'local';
}

const autoRepository: TrendMapRepository = new Proxy({} as TrendMapRepository, {
  get(_target, prop) {
    return async (...args: any[]) => {
      const repo = await resolveRepository();
      const member = (repo as any)[prop];
      if (typeof member !== 'function') return member;
      return member.apply(repo, args);
    };
  }
});

// Normal dev mode auto-detects the backend. Successful API detection is cached,
// but a browser-storage fallback is not, so a backend that starts moments later
// can still be picked up without restarting the frontend.
export const repository: TrendMapRepository = forceApi
  ? apiRepository
  : (forceLocal || isTest)
    ? localRepository
    : autoRepository;
