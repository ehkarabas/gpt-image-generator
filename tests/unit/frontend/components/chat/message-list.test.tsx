import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MessageList } from "@/components/chat/message-list";

const mockMessages = [
  {
    id: "msg-1",
    content: "Hello, how are you?",
    role: "user" as const,
    created_at: "2024-01-15T10:30:00Z",
    user: {
      display_name: "John Doe",
      avatar_url: "https://example.com/avatar.png",
    },
  },
  {
    id: "msg-2",
    content: "I am doing well, thank you! How can I help you today?",
    role: "assistant" as const,
    created_at: "2024-01-15T10:31:00Z",
  },
  {
    id: "msg-3",
    content: "Can you generate an image for me?",
    role: "user" as const,
    created_at: "2024-01-15T10:32:00Z",
    user: {
      display_name: "John Doe",
      avatar_url: "https://example.com/avatar.png",
    },
  },
  {
    id: "msg-4",
    content: "Sure! Here are some images based on your request:",
    role: "assistant" as const,
    created_at: "2024-01-15T10:33:00Z",
    images: [
      {
        id: "img-1",
        image_url: "https://example.com/generated-image-1.png",
        prompt: "A beautiful landscape",
        size: "1024x1024",
        quality: "hd",
        model: "dall-e-3",
      },
      {
        id: "img-2",
        image_url: "https://example.com/generated-image-2.png",
        prompt: "A beautiful landscape",
        size: "1024x1024",
        quality: "standard",
        model: "dall-e-3",
      },
    ],
  },
];

const mockEmptyMessages: any[] = [];

// Mock the scrollIntoView function
Element.prototype.scrollIntoView = vi.fn();

describe("MessageList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders message list container with proper test id", () => {
    render(<MessageList messages={mockMessages} />);

    expect(screen.getByTestId("message-list-container")).toBeInTheDocument();
  });

  it("renders correct number of messages", () => {
    render(<MessageList messages={mockMessages} />);

    const messageItems = screen.getAllByTestId(/^message-item-/);
    expect(messageItems).toHaveLength(4);
  });

  it("renders messages in correct order (chronological)", () => {
    render(<MessageList messages={mockMessages} />);

    const messageItems = screen.getAllByTestId(/^message-item-/);

    // First message should be from user
    expect(messageItems[0]).toHaveAttribute(
      "data-testid",
      "message-item-msg-1",
    );

    // Second message should be from assistant
    expect(messageItems[1]).toHaveAttribute(
      "data-testid",
      "message-item-msg-2",
    );

    // Third message should be from user
    expect(messageItems[2]).toHaveAttribute(
      "data-testid",
      "message-item-msg-3",
    );

    // Fourth message should be from assistant with images
    expect(messageItems[3]).toHaveAttribute(
      "data-testid",
      "message-item-msg-4",
    );
  });

  it("handles empty message list gracefully", () => {
    render(<MessageList messages={mockEmptyMessages} />);

    expect(screen.getByTestId("message-list-container")).toBeInTheDocument();
    expect(screen.queryByTestId(/^message-item-/)).not.toBeInTheDocument();
  });

  it("renders empty state when no messages", () => {
    render(<MessageList messages={mockEmptyMessages} />);

    expect(screen.getByTestId("message-list-empty")).toBeInTheDocument();
    expect(screen.getByText(/start a conversation/i)).toBeInTheDocument();
  });

  it("applies correct styling classes", () => {
    render(<MessageList messages={mockMessages} />);

    const container = screen.getByTestId("message-list-container");
    expect(container).toHaveClass("flex", "flex-col", "space-y-4", "p-4");
  });

  it("renders loading state correctly", () => {
    render(<MessageList messages={mockMessages} isLoading={true} />);

    expect(screen.getByTestId("message-list-loading")).toBeInTheDocument();
    expect(screen.getByText(/loading messages/i)).toBeInTheDocument();
  });

  it("does not render loading state when not loading", () => {
    render(<MessageList messages={mockMessages} isLoading={false} />);

    expect(
      screen.queryByTestId("message-list-loading"),
    ).not.toBeInTheDocument();
  });

  it("auto-scrolls to bottom on new message with autoScroll enabled", async () => {
    const scrollIntoViewSpy = vi.spyOn(Element.prototype, "scrollIntoView");

    const { rerender } = render(
      <MessageList messages={mockMessages.slice(0, 2)} autoScroll={true} />,
    );

    // Add a new message
    rerender(<MessageList messages={mockMessages} autoScroll={true} />);

    await waitFor(() => {
      expect(scrollIntoViewSpy).toHaveBeenCalled();
    });
  });

  it("does not auto-scroll when autoScroll is disabled", async () => {
    const scrollIntoViewSpy = vi.spyOn(Element.prototype, "scrollIntoView");

    const { rerender } = render(
      <MessageList messages={mockMessages.slice(0, 2)} autoScroll={false} />,
    );

    // Add a new message
    rerender(<MessageList messages={mockMessages} autoScroll={false} />);

    // Wait a short time to ensure no scroll happens
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
  });

  it("handles messages with images correctly", () => {
    render(<MessageList messages={mockMessages} />);

    // Should render the message with images
    const messageWithImages = screen.getByTestId("message-item-msg-4");
    expect(messageWithImages).toBeInTheDocument();

    // Should contain generated images
    const generatedImages = screen.getAllByTestId(/^generated-image-/);
    expect(generatedImages).toHaveLength(2);
  });

  it("passes correct props to MessageItem components", () => {
    render(<MessageList messages={[mockMessages[0]]} />);

    const messageItem = screen.getByTestId("message-item-msg-1");
    expect(messageItem).toBeInTheDocument();

    // Check if message content is rendered
    expect(screen.getByText("Hello, how are you?")).toBeInTheDocument();
  });

  it("applies custom className when provided", () => {
    const customClassName = "custom-message-list";
    render(<MessageList messages={mockMessages} className={customClassName} />);

    const container = screen.getByTestId("message-list-container");
    expect(container).toHaveClass(customClassName);
  });

  it("handles null or undefined messages gracefully", () => {
    // @ts-expect-error Testing error handling
    render(<MessageList messages={null} />);

    expect(screen.getByTestId("message-list-container")).toBeInTheDocument();
    expect(screen.getByTestId("message-list-empty")).toBeInTheDocument();
  });

  it("renders messages with proper spacing", () => {
    render(<MessageList messages={mockMessages} />);

    const container = screen.getByTestId("message-list-container");
    expect(container).toHaveClass("space-y-4");
  });

  it("maintains scroll position when showScrollToBottom is visible", () => {
    render(<MessageList messages={mockMessages} showScrollToBottom={true} />);

    expect(screen.getByTestId("scroll-to-bottom-button")).toBeInTheDocument();
  });

  it("hides scroll to bottom button when not needed", () => {
    render(<MessageList messages={mockMessages} showScrollToBottom={false} />);

    expect(
      screen.queryByTestId("scroll-to-bottom-button"),
    ).not.toBeInTheDocument();
  });
});
