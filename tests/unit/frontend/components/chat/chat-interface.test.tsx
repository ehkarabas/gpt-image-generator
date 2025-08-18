import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChatInterface } from "@/components/chat/chat-interface";

// Mock the child components
vi.mock("@/components/chat/message-list", () => ({
  MessageList: ({ messages, isLoading }: any) => (
    <div data-testid="message-list-mock">
      <div data-testid="message-count">{messages?.length || 0}</div>
      {isLoading && <div data-testid="loading-indicator">Loading...</div>}
    </div>
  ),
}));

vi.mock("@/components/chat/chat-input", () => ({
  ChatInput: ({ onSend }: any) => (
    <div data-testid="chat-input-mock">
      <button
        onClick={() => onSend?.("test message")}
        data-testid="mock-send-button"
      >
        Send Test Message
      </button>
    </div>
  ),
}));

vi.mock("@/components/layout/simple-layout", () => ({
  SimpleLayout: ({ children }: any) => (
    <div data-testid="simple-layout-mock">{children}</div>
  ),
}));

// Mock the hooks
const mockMessages = [
  {
    id: "msg-1",
    content: "Hello!",
    role: "user" as const,
    created_at: "2024-01-15T10:30:00Z",
    user: { display_name: "John Doe" },
  },
  {
    id: "msg-2",
    content: "Hi there! How can I help you?",
    role: "assistant" as const,
    created_at: "2024-01-15T10:31:00Z",
  },
];

const mockUseMessages = {
  messages: mockMessages,
  sendMessage: vi.fn(),
  error: null,
  clearError: vi.fn(),
  retry: vi.fn(),
  loadMoreMessages: vi.fn(),
  hasMore: false,
  isLoading: false,
};

vi.mock("@/hooks/use-messages", () => ({
  useMessages: () => mockUseMessages,
}));

describe("ChatInterface", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockUseMessages.messages = mockMessages;
    mockUseMessages.error = null;
    mockUseMessages.isLoading = false;
  });

  it("renders chat interface container with proper test id", () => {
    render(<ChatInterface />);

    expect(screen.getByTestId("chat-interface-container")).toBeInTheDocument();
  });

  it("renders within simple layout wrapper", () => {
    render(<ChatInterface />);

    expect(screen.getByTestId("simple-layout-mock")).toBeInTheDocument();
  });

  it("renders message list component", () => {
    render(<ChatInterface />);

    expect(screen.getByTestId("message-list-mock")).toBeInTheDocument();
  });

  it("renders chat input component", () => {
    render(<ChatInterface />);

    expect(screen.getByTestId("chat-input-mock")).toBeInTheDocument();
  });

  it("passes messages to message list correctly", () => {
    render(<ChatInterface />);

    expect(screen.getByTestId("message-count")).toHaveTextContent("2");
  });

  it("handles message sending correctly", async () => {
    render(<ChatInterface />);

    const sendButton = screen.getByTestId("mock-send-button");
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockUseMessages.sendMessage).toHaveBeenCalledWith("test message");
    });
  });

  it("shows loading state when messages are loading", () => {
    mockUseMessages.isLoading = true;

    render(<ChatInterface />);

    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
  });

  it("applies correct layout structure", () => {
    render(<ChatInterface />);

    const container = screen.getByTestId("chat-interface-container");
    expect(container).toHaveClass("flex", "flex-col", "h-full");
  });

  it("renders error state when there is an error", () => {
    (mockUseMessages as any).error = { message: "Connection failed" };

    render(<ChatInterface />);

    expect(screen.getByTestId("chat-error-message")).toBeInTheDocument();
    expect(screen.getByText("Connection failed")).toBeInTheDocument();
  });

  it("renders retry button when there is an error", () => {
    (mockUseMessages as any).error = { message: "Connection failed" };

    render(<ChatInterface />);

    expect(screen.getByTestId("chat-retry-button")).toBeInTheDocument();
  });

  it("handles retry action correctly", async () => {
    (mockUseMessages as any).error = { message: "Connection failed" };

    render(<ChatInterface />);

    const retryButton = screen.getByTestId("chat-retry-button");
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(mockUseMessages.retry).toHaveBeenCalled();
    });
  });

  it("clears error when dismiss button is clicked", async () => {
    (mockUseMessages as any).error = { message: "Connection failed" };

    render(<ChatInterface />);

    const dismissButton = screen.getByTestId("chat-error-dismiss");
    fireEvent.click(dismissButton);

    await waitFor(() => {
      expect(mockUseMessages.clearError).toHaveBeenCalled();
    });
  });

  it("has proper accessibility attributes", () => {
    render(<ChatInterface />);

    const container = screen.getByTestId("chat-interface-container");
    expect(container).toHaveAttribute("role", "region");
    expect(container).toHaveAttribute("aria-label", "Chat interface");
  });

  it("supports custom className", () => {
    render(<ChatInterface className="custom-chat" />);

    const container = screen.getByTestId("chat-interface-container");
    expect(container).toHaveClass("custom-chat");
  });

  it("handles empty message list gracefully", () => {
    mockUseMessages.messages = [];

    render(<ChatInterface />);

    expect(screen.getByTestId("message-count")).toHaveTextContent("0");
  });

  it("renders welcome message when no messages exist", () => {
    mockUseMessages.messages = [];

    render(<ChatInterface />);

    expect(screen.getByTestId("chat-welcome-message")).toBeInTheDocument();
    expect(
      screen.getByText(/welcome to gpt image generator/i),
    ).toBeInTheDocument();
  });

  it("hides welcome message when messages exist", () => {
    mockUseMessages.messages = mockMessages;

    render(<ChatInterface />);

    expect(
      screen.queryByTestId("chat-welcome-message"),
    ).not.toBeInTheDocument();
  });

  it("renders connection status indicator", () => {
    render(<ChatInterface />);

    expect(screen.getByTestId("chat-connection-status")).toBeInTheDocument();
  });

  it("shows online status when connected", () => {
    render(<ChatInterface />);

    const statusIndicator = screen.getByTestId("chat-connection-status");
    expect(statusIndicator).toHaveClass("text-green-500");
  });
});
