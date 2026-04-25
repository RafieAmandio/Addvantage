import "@testing-library/jest-dom";
import { vi, expect } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) =>
    React.createElement("img", props),
}));

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  supabaseBrowser: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          data: [],
          then: (cb: (v: unknown) => void) => cb([]),
        })),
        then: (cb: (v: unknown) => void) => cb([]),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          then: (cb: (v: unknown) => void) => cb([]),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          then: (cb: (v: unknown) => void) => cb([]),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          then: (cb: (v: unknown) => void) => cb([]),
        })),
      })),
    })),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      signInWithOtp: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
  }),
}));

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Warning: ReactDOM.render")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
