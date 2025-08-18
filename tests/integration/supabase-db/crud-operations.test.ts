import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";

// Environment variables for testing
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const hasServiceKey = Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);

// Create service client for testing CRUD operations
let serviceClient: ReturnType<typeof createClient<Database>>;
let testUserId: string;
let testConversationId: string;
let testMessageId: string;
let testImageId: string;

describe("Database CRUD Operations", () => {
  beforeAll(async () => {
    if (!hasServiceKey) {
      console.log("Skipping CRUD tests - missing service key");
      return;
    }

    serviceClient = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Create a test user ID (in real scenario this would come from auth.users)
    testUserId = "10000000-0000-0000-0000-000000000001";
  });

  afterAll(async () => {
    if (!hasServiceKey) return;

    // Clean up test data in reverse dependency order
    try {
      if (testImageId) {
        await serviceClient.from("images").delete().eq("id", testImageId);
      }
      if (testMessageId) {
        await serviceClient.from("messages").delete().eq("id", testMessageId);
      }
      if (testConversationId) {
        await serviceClient
          .from("conversations")
          .delete()
          .eq("id", testConversationId);
      }
      // Clean up test profile
      await serviceClient.from("profiles").delete().eq("id", testUserId);
    } catch (error) {
      console.log("Cleanup error (expected):", error);
    }
  });

  describe("Profiles CRUD Operations", () => {
    it("should create a profile", async () => {
      if (!hasServiceKey) {
        console.log("Skipping profile create test - missing service key");
        return;
      }

      const { data, error } = await serviceClient
        .from("profiles")
        .insert({
          id: testUserId,
          email: "test@example.com",
          display_name: "Test User",
          avatar_url: "https://example.com/avatar.jpg",
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.id).toBe(testUserId);
      expect(data.email).toBe("test@example.com");
      expect(data.display_name).toBe("Test User");
    });

    it("should read a profile", async () => {
      if (!hasServiceKey) {
        console.log("Skipping profile read test - missing service key");
        return;
      }

      const { data, error } = await serviceClient
        .from("profiles")
        .select("*")
        .eq("id", testUserId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.id).toBe(testUserId);
      expect(data.email).toBe("test@example.com");
    });

    it("should update a profile", async () => {
      if (!hasServiceKey) {
        console.log("Skipping profile update test - missing service key");
        return;
      }

      const { data, error } = await serviceClient
        .from("profiles")
        .update({
          display_name: "Updated Test User",
          preferences: { theme: "dark", language: "en" },
        })
        .eq("id", testUserId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.display_name).toBe("Updated Test User");
      expect(data.preferences).toEqual({ theme: "dark", language: "en" });
    });
  });

  describe("Conversations CRUD Operations", () => {
    it("should create a conversation", async () => {
      if (!hasServiceKey) {
        console.log("Skipping conversation create test - missing service key");
        return;
      }

      const { data, error } = await serviceClient
        .from("conversations")
        .insert({
          title: "Test Conversation",
          user_id: testUserId,
          summary: "A test conversation for CRUD testing",
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.title).toBe("Test Conversation");
      expect(data.user_id).toBe(testUserId);

      testConversationId = data.id;
    });

    it("should read conversations", async () => {
      if (!hasServiceKey) {
        console.log("Skipping conversation read test - missing service key");
        return;
      }

      const { data, error } = await serviceClient
        .from("conversations")
        .select("*")
        .eq("user_id", testUserId);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data!.length).toBeGreaterThan(0);
      expect(data![0].user_id).toBe(testUserId);
    });

    it("should update a conversation", async () => {
      if (!hasServiceKey || !testConversationId) {
        console.log("Skipping conversation update test - missing dependencies");
        return;
      }

      const { data, error } = await serviceClient
        .from("conversations")
        .update({
          title: "Updated Test Conversation",
          message_count: 2,
        })
        .eq("id", testConversationId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.title).toBe("Updated Test Conversation");
      expect(data.message_count).toBe(2);
    });
  });

  describe("Messages CRUD Operations", () => {
    it("should create a message", async () => {
      if (!hasServiceKey || !testConversationId) {
        console.log("Skipping message create test - missing dependencies");
        return;
      }

      const { data, error } = await serviceClient
        .from("messages")
        .insert({
          conversation_id: testConversationId,
          content: "Hello, this is a test message!",
          role: "user",
          metadata: { tokens: 8, model: "gpt-4" },
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.conversation_id).toBe(testConversationId);
      expect(data.content).toBe("Hello, this is a test message!");
      expect(data.role).toBe("user");

      testMessageId = data.id;
    });

    it("should read messages for a conversation", async () => {
      if (!hasServiceKey || !testConversationId) {
        console.log("Skipping message read test - missing dependencies");
        return;
      }

      const { data, error } = await serviceClient
        .from("messages")
        .select("*")
        .eq("conversation_id", testConversationId)
        .order("created_at", { ascending: true });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data!.length).toBeGreaterThan(0);
      expect(data![0].conversation_id).toBe(testConversationId);
    });

    it("should update a message", async () => {
      if (!hasServiceKey || !testMessageId) {
        console.log("Skipping message update test - missing dependencies");
        return;
      }

      const { data, error } = await serviceClient
        .from("messages")
        .update({
          content: "Updated test message content",
          metadata: {
            tokens: 10,
            model: "gpt-4",
            editedAt: new Date().toISOString(),
          },
        })
        .eq("id", testMessageId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.content).toBe("Updated test message content");
      expect(data.metadata).toHaveProperty("editedAt");
    });

    it("should enforce role constraint", async () => {
      if (!hasServiceKey || !testConversationId) {
        console.log("Skipping role constraint test - missing dependencies");
        return;
      }

      const { error } = await serviceClient.from("messages").insert({
        conversation_id: testConversationId,
        content: "Invalid role message",
        role: "invalid_role" as any,
      });

      expect(error).toBeTruthy();
      expect(error?.message).toContain("check");
    });
  });

  describe("Images CRUD Operations", () => {
    it("should create an image", async () => {
      if (!hasServiceKey || !testMessageId) {
        console.log("Skipping image create test - missing dependencies");
        return;
      }

      const { data, error } = await serviceClient
        .from("images")
        .insert({
          user_id: testUserId,
          message_id: testMessageId,
          prompt: "A beautiful sunset over mountains",
          image_url: "https://example.com/generated-image.jpg",
          thumbnail_url: "https://example.com/thumbnail.jpg",
          size: "1024x1024",
          model: "dall-e-3",
          quality: "hd",
          style: "vivid",
          generation_time_ms: 5000,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.user_id).toBe(testUserId);
      expect(data.prompt).toBe("A beautiful sunset over mountains");
      expect(data.size).toBe("1024x1024");
      expect(data.model).toBe("dall-e-3");

      testImageId = data.id;
    });

    it("should read images for a user", async () => {
      if (!hasServiceKey) {
        console.log("Skipping image read test - missing service key");
        return;
      }

      const { data, error } = await serviceClient
        .from("images")
        .select("*")
        .eq("user_id", testUserId)
        .order("created_at", { ascending: false });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data!.length).toBeGreaterThan(0);
      expect(data![0].user_id).toBe(testUserId);
    });

    it("should update an image", async () => {
      if (!hasServiceKey || !testImageId) {
        console.log("Skipping image update test - missing dependencies");
        return;
      }

      const { data, error } = await serviceClient
        .from("images")
        .update({
          revised_prompt: "A stunning sunset over snow-capped mountains",
          thumbnail_url: "https://example.com/updated-thumbnail.jpg",
        })
        .eq("id", testImageId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.revised_prompt).toBe(
        "A stunning sunset over snow-capped mountains",
      );
      expect(data.thumbnail_url).toBe(
        "https://example.com/updated-thumbnail.jpg",
      );
    });
  });

  describe("Foreign Key Constraint Testing", () => {
    it("should prevent creating conversation with invalid user_id", async () => {
      if (!hasServiceKey) {
        console.log("Skipping FK constraint test - missing service key");
        return;
      }

      const { error } = await serviceClient.from("conversations").insert({
        title: "Invalid Conversation",
        user_id: "99999999-9999-9999-9999-999999999999", // Non-existent user
      });

      expect(error).toBeTruthy();
      expect(error?.message).toContain("foreign key");
    });

    it("should prevent creating message with invalid conversation_id", async () => {
      if (!hasServiceKey) {
        console.log("Skipping FK constraint test - missing service key");
        return;
      }

      const { error } = await serviceClient.from("messages").insert({
        conversation_id: "99999999-9999-9999-9999-999999999999", // Non-existent conversation
        content: "Invalid message",
        role: "user",
      });

      expect(error).toBeTruthy();
      expect(error?.message).toContain("foreign key");
    });

    it("should cascade delete messages when conversation is deleted", async () => {
      if (!hasServiceKey) {
        console.log("Skipping cascade delete test - missing service key");
        return;
      }

      // Create a test conversation and message
      const { data: conversation } = await serviceClient
        .from("conversations")
        .insert({
          title: "Cascade Test Conversation",
          user_id: testUserId,
        })
        .select()
        .single();

      const { data: message } = await serviceClient
        .from("messages")
        .insert({
          conversation_id: conversation!.id,
          content: "Test message for cascade",
          role: "user",
        })
        .select()
        .single();

      // Delete the conversation
      await serviceClient
        .from("conversations")
        .delete()
        .eq("id", conversation!.id);

      // Verify the message was also deleted
      const { data: remainingMessages } = await serviceClient
        .from("messages")
        .select()
        .eq("id", message!.id);

      expect(remainingMessages).toHaveLength(0);
    });
  });

  describe("Soft Delete Functionality", () => {
    it("should support soft delete with deleted_at timestamp", async () => {
      if (!hasServiceKey) {
        console.log("Skipping soft delete test - missing service key");
        return;
      }

      // Create a test conversation for soft delete
      const { data: conversation } = await serviceClient
        .from("conversations")
        .insert({
          title: "Soft Delete Test",
          user_id: testUserId,
        })
        .select()
        .single();

      // Soft delete by setting deleted_at
      const now = new Date().toISOString();
      const { data: updated } = await serviceClient
        .from("conversations")
        .update({ deleted_at: now })
        .eq("id", conversation!.id)
        .select()
        .single();

      expect(updated?.deleted_at).toBe(now);

      // Clean up
      await serviceClient
        .from("conversations")
        .delete()
        .eq("id", conversation!.id);
    });
  });
});
