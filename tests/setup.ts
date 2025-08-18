// test setup file for Vitest
import React from "react";
import "@testing-library/jest-dom";
import { vi } from "vitest";

// Make React globally available
global.React = React;

// Global test mocks and setup
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = "";
  thresholds: number[] = [];
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
} as any;

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter() {
    return {
      route: "/",
      pathname: "/",
      query: {},
      asPath: "/",
      push: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
      back: vi.fn(),
      prefetch: vi.fn().mockResolvedValue(undefined),
      beforePopState: vi.fn(),
      events: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      },
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "/";
  },
}));

// Mock Supabase client - use full path to be sure
vi.mock("@/lib/supabase/client", () => ({
  default: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    })),
  },
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    })),
  },
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Send: ({ className, ...props }: any) =>
    React.createElement("div", {
      "data-testid": "send-icon",
      className,
      ...props,
    }),
  Loader2: ({ className, ...props }: any) =>
    React.createElement("div", {
      "data-testid": "loader-icon",
      className,
      ...props,
    }),
  Download: ({ className, ...props }: any) =>
    React.createElement("div", {
      "data-testid": "download-icon",
      className,
      ...props,
    }),
  ExternalLink: ({ className, ...props }: any) =>
    React.createElement("div", {
      "data-testid": "external-link-icon",
      className,
      ...props,
    }),
  ChevronUp: ({ className, ...props }: any) =>
    React.createElement("div", {
      "data-testid": "chevron-up-icon",
      className,
      ...props,
    }),
  ArrowDown: ({ className, ...props }: any) =>
    React.createElement("div", {
      "data-testid": "arrow-down-icon",
      className,
      ...props,
    }),
  RefreshCw: ({ className, ...props }: any) =>
    React.createElement("div", {
      "data-testid": "refresh-icon",
      className,
      ...props,
    }),
  Wifi: ({ className, ...props }: any) =>
    React.createElement("div", {
      "data-testid": "wifi-icon",
      className,
      ...props,
    }),
  X: () => React.createElement("div", { "data-testid": "x-icon" }),
  Check: () => React.createElement("div", { "data-testid": "check-icon" }),
  AlertCircle: () =>
    React.createElement("div", { "data-testid": "alert-icon" }),
  Plus: () => React.createElement("div", { "data-testid": "plus-icon" }),
  Menu: () => React.createElement("div", { "data-testid": "menu-icon" }),
  MessageSquare: () =>
    React.createElement("div", { "data-testid": "message-square-icon" }),
  ChevronDown: () =>
    React.createElement("div", { "data-testid": "chevron-down-icon" }),
  MoreHorizontal: () =>
    React.createElement("div", { "data-testid": "more-horizontal-icon" }),
  Edit2: () => React.createElement("div", { "data-testid": "edit2-icon" }),
  Trash2: () => React.createElement("div", { "data-testid": "trash2-icon" }),
  Search: () => React.createElement("div", { "data-testid": "search-icon" }),
}));

// Mock @/lib/utils
vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

// Mock UI components with simple implementations
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, className, type, ...props }: any) =>
    React.createElement(
      "button",
      {
        onClick,
        disabled,
        className,
        type: type || "button",
        "data-testid": props["data-testid"] || "button",
        "aria-label": props["aria-label"],
        ...props,
      },
      children,
    ),
}));

vi.mock("@/components/ui/textarea", () => ({
  Textarea: React.forwardRef(
    (
      {
        className,
        onChange,
        onKeyDown,
        value,
        placeholder,
        disabled,
        ...props
      }: any,
      ref: any,
    ) =>
      React.createElement("textarea", {
        ref,
        className,
        onChange,
        onKeyDown,
        value,
        placeholder,
        disabled,
        "data-testid": props["data-testid"] || "textarea",
        "aria-label": props["aria-label"],
        "aria-describedby": props["aria-describedby"],
        ...props,
      }),
  ),
}));
