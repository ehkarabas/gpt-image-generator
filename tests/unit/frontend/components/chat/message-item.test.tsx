import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { MessageItem } from "@/components/chat/message-item";

const mockUserMessage = {
  id: "msg-1",
  content: "Hello, can you generate an image for me?",
  role: "user" as const,
  created_at: "2024-01-15T10:30:00Z",
  user: {
    display_name: "John Doe",
    avatar_url: "https://example.com/avatar.png",
  },
};

const mockAssistantMessage = {
  id: "msg-2",
  content: "Sure! I can help you generate an image.",
  role: "assistant" as const,
  created_at: "2024-01-15T10:31:00Z",
};

const mockMessageWithImages = {
  id: "msg-3",
  content: "Here are the images you requested:",
  role: "assistant" as const,
  created_at: "2024-01-15T10:32:00Z",
  images: [
    {
      id: "img-1",
      image_url: "https://example.com/image1.png",
      prompt: "A beautiful sunset",
      size: "1024x1024",
      quality: "hd",
    },
    {
      id: "img-2",
      image_url: "https://example.com/image2.png",
      prompt: "A mountain landscape",
      size: "1024x1024",
    },
  ],
};

describe("MessageItem", () => {
  beforeEach(() => {
    // Mock formatTime utility
    Date.prototype.toLocaleTimeString = () => "10:30 AM";
  });

  it("renders user message with correct structure", () => {
    render(<MessageItem message={mockUserMessage} index={0} />);

    expect(screen.getByTestId("message-user")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-user")).toBeInTheDocument();
    expect(screen.getByTestId("message-content-user")).toBeInTheDocument();
    expect(screen.getByTestId("message-timestamp-user")).toBeInTheDocument();
  });

  it("renders assistant message with correct structure", () => {
    render(<MessageItem message={mockAssistantMessage} index={0} />);

    expect(screen.getByTestId("message-assistant")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-assistant")).toBeInTheDocument();
    expect(screen.getByTestId("message-content-assistant")).toBeInTheDocument();
    expect(
      screen.getByTestId("message-timestamp-assistant"),
    ).toBeInTheDocument();
  });

  it("displays correct message content", () => {
    render(<MessageItem message={mockUserMessage} index={0} />);

    const content = screen.getByTestId("message-content-user");
    expect(content).toHaveTextContent(
      "Hello, can you generate an image for me?",
    );
  });

  it("shows user avatar and fallback", () => {
    render(<MessageItem message={mockUserMessage} index={0} />);

    const avatar = screen.getByTestId("avatar-user");
    expect(avatar).toBeInTheDocument();

    // Should have proper alt text for the avatar image
    const avatarImg = avatar.querySelector("img");
    if (avatarImg) {
      expect(avatarImg).toHaveAttribute("alt", "User avatar");
    }
  });

  it("shows assistant avatar with correct fallback", () => {
    render(<MessageItem message={mockAssistantMessage} index={0} />);

    const avatar = screen.getByTestId("avatar-assistant");
    expect(avatar).toBeInTheDocument();

    // Should have proper alt text for AI avatar
    const avatarImg = avatar.querySelector("img");
    if (avatarImg) {
      expect(avatarImg).toHaveAttribute("alt", "AI assistant avatar");
    }
  });

  it("applies correct CSS classes for user messages", () => {
    render(<MessageItem message={mockUserMessage} index={0} />);

    const container = screen.getByTestId("message-user");
    expect(container).toHaveClass("flex-row-reverse");
  });

  it("applies correct CSS classes for assistant messages", () => {
    render(<MessageItem message={mockAssistantMessage} index={0} />);

    const container = screen.getByTestId("message-assistant");
    expect(container).toHaveClass("flex-row");
  });

  it("renders images when present", () => {
    render(<MessageItem message={mockMessageWithImages} index={0} />);

    expect(screen.getByTestId("message-images")).toBeInTheDocument();
    expect(screen.getAllByTestId("generated-image")).toHaveLength(2);
  });

  it("does not render images section when no images", () => {
    render(<MessageItem message={mockUserMessage} index={0} />);

    expect(screen.queryByTestId("message-images")).not.toBeInTheDocument();
  });

  it("has correct accessibility attributes", () => {
    render(<MessageItem message={mockUserMessage} index={0} />);

    const container = screen.getByTestId("message-user");
    expect(container).toHaveAttribute("role", "article");
    expect(container).toHaveAttribute("aria-label", "User message");
  });

  it("has correct data attributes", () => {
    render(<MessageItem message={mockUserMessage} index={1} />);

    const container = screen.getByTestId("message-user");
    expect(container).toHaveAttribute("data-message-id", "msg-1");
    expect(container).toHaveAttribute("data-message-index", "1");
  });

  it("formats timestamp correctly", () => {
    render(<MessageItem message={mockUserMessage} index={0} />);

    const timestamp = screen.getByTestId("message-timestamp-user");
    expect(timestamp).toHaveAttribute("dateTime", "2024-01-15T10:30:00Z");
  });

  it("preserves whitespace in message content", () => {
    const messageWithWhitespace = {
      ...mockUserMessage,
      content: "Line 1\nLine 2\n\nLine 4",
    };

    render(<MessageItem message={messageWithWhitespace} index={0} />);

    const content = screen.getByTestId("message-content-user");
    expect(content).toHaveClass("whitespace-pre-wrap");
  });

  it("handles missing user display name gracefully", () => {
    const messageWithoutDisplayName = {
      ...mockUserMessage,
      user: {
        avatar_url: "https://example.com/avatar.png",
      },
    };

    render(<MessageItem message={messageWithoutDisplayName} index={0} />);

    // Should still render without errors
    expect(screen.getByTestId("message-user")).toBeInTheDocument();
  });

  it("handles missing user data gracefully", () => {
    const messageWithoutUser = {
      ...mockUserMessage,
      user: undefined,
    };

    render(<MessageItem message={messageWithoutUser} index={0} />);

    // Should still render without errors
    expect(screen.getByTestId("message-user")).toBeInTheDocument();
  });

  it("renders assistant message without user data", () => {
    render(<MessageItem message={mockAssistantMessage} index={0} />);

    const container = screen.getByTestId("message-assistant");
    expect(container).toHaveAttribute("aria-label", "Assistant message");
  });
});
