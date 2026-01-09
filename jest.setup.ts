/**
 * Jest Setup File
 * 
 * Runs before each test file. Used to configure Testing Library
 * and add custom matchers. Also sets up polyfills for Next.js
 * server-side APIs.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

import '@testing-library/jest-dom';

/**
 * Polyfill Next.js server APIs for testing
 * 
 * Next.js provides Request, Response, and Headers in its runtime,
 * but these aren't available in Jest. We provide minimal implementations
 * that support the APIs we use in our route handlers.
 */
if (typeof Request === 'undefined') {
  (global as unknown as { Request: typeof Request }).Request = class Request {
    url: string;
    method: string;
    headers: Headers;
    body: string;

    constructor(input: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) {
      this.url = input;
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers);
      this.body = init?.body || '';
    }

    async json() {
      return JSON.parse(this.body);
    }
  };
}

if (typeof Response === 'undefined') {
  (global as unknown as { Response: typeof Response }).Response = class Response {
    body: string;
    status: number;
    statusText: string;
    headers: Headers;

    constructor(body: string, init?: { status?: number; statusText?: string; headers?: Record<string, string> }) {
      this.body = body;
      this.status = init?.status || 200;
      this.statusText = init?.statusText || 'OK';
      this.headers = new Headers(init?.headers);
    }

    async json() {
      return JSON.parse(this.body);
    }

    /**
     * Static json method used by NextResponse
     * 
     * Creates a Response with JSON body and proper headers
     */
    static json(data: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      const body = JSON.stringify(data);
      const response = new Response(body, init);
      response.headers.set('content-type', 'application/json');
      return response;
    }
  };
}

if (typeof Headers === 'undefined') {
  (global as unknown as { Headers: typeof Headers }).Headers = class Headers {
    private map: Map<string, string>;

    constructor(init?: Record<string, string>) {
      this.map = new Map();
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this.map.set(key.toLowerCase(), value);
        });
      }
    }

    get(name: string) {
      return this.map.get(name.toLowerCase());
    }

    set(name: string, value: string) {
      this.map.set(name.toLowerCase(), value);
    }

    has(name: string) {
      return this.map.has(name.toLowerCase());
    }
  };
}

/**
 * Mock UUID library
 * 
 * UUID v4 generation needs to return unique IDs for tests.
 * We use a counter to ensure uniqueness.
 */
let uuidCounter = 0;
jest.mock('uuid', () => ({
  v4: () => `test-uuid-${++uuidCounter}`,
}));

/**
 * Mock Next.js router for tests
 * 
 * Next.js router is not available in Jest environment,
 * so we mock it with basic functionality.
 */
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
      pathname: '/',
      query: {},
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

/**
 * Mock NextAuth for tests
 * 
 * NextAuth session hooks need to be mocked for component tests.
 */
jest.mock('next-auth/react', () => ({
  useSession() {
    return {
      data: {
        user: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
        },
      },
      status: 'authenticated',
    };
  },
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

/**
 * Mock window.matchMedia
 * 
 * Used by Material-UI for responsive design.
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

/**
 * Mock localStorage
 * 
 * Since tests run in Node, we need to mock browser APIs.
 */
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
