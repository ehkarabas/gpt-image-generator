import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";

// Environment variables for testing
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const hasEnv = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const hasServiceKey = Boolean(SUPABASE_SERVICE_KEY);

// Create clients for testing
let anonClient: ReturnType<typeof createClient>;
let serviceClient: ReturnType<typeof createClient>;

describe("Database Schema & RLS Validation", () => {
  beforeAll(() => {
    if (hasEnv) {
      anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    if (hasServiceKey) {
      serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    }
  });

  describe("Table Structure Validation", () => {
    it("should verify all required tables exist", async () => {
      if (!hasServiceKey) {
        console.log("Skipping table structure test - missing service key");
        return;
      }

      // Query information_schema to check table existence
      const { data: tables, error } = await serviceClient
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .in("table_name", ["profiles", "conversations", "messages", "images"]);

      expect(error).toBeNull();
      expect(tables).toBeDefined();

      const tableNames = tables?.map((t) => t.table_name) || [];
      expect(tableNames).toContain("profiles");
      expect(tableNames).toContain("conversations");
      expect(tableNames).toContain("messages");
      expect(tableNames).toContain("images");
    });

    it("should verify foreign key constraints exist", async () => {
      if (!hasServiceKey) {
        console.log("Skipping foreign key test - missing service key");
        return;
      }

      // Check foreign key constraints
      const { data: constraints, error } =
        await serviceClient.rpc("get_foreign_keys");

      if (error && error.message.includes("function")) {
        // If function doesn't exist, query constraints table directly
        const { data: fkConstraints, error: fkError } = await serviceClient
          .from("information_schema.table_constraints")
          .select("constraint_name, table_name")
          .eq("constraint_type", "FOREIGN KEY")
          .in("table_name", ["conversations", "messages", "images"]);

        expect(fkError).toBeNull();
        expect(fkConstraints).toBeDefined();
        expect(fkConstraints!.length).toBeGreaterThan(0);
      }
    });

    it("should verify required columns exist in each table", async () => {
      if (!hasServiceKey) {
        console.log("Skipping column validation test - missing service key");
        return;
      }

      // Check profiles table columns
      const { data: profileColumns, error: profileError } = await serviceClient
        .from("information_schema.columns")
        .select("column_name, data_type, is_nullable")
        .eq("table_name", "profiles")
        .eq("table_schema", "public");

      expect(profileError).toBeNull();
      const profileColumnNames =
        profileColumns?.map((c) => c.column_name) || [];
      expect(profileColumnNames).toContain("id");
      expect(profileColumnNames).toContain("email");
      expect(profileColumnNames).toContain("display_name");
      expect(profileColumnNames).toContain("created_at");

      // Check conversations table columns
      const { data: convColumns, error: convError } = await serviceClient
        .from("information_schema.columns")
        .select("column_name")
        .eq("table_name", "conversations")
        .eq("table_schema", "public");

      expect(convError).toBeNull();
      const convColumnNames = convColumns?.map((c) => c.column_name) || [];
      expect(convColumnNames).toContain("id");
      expect(convColumnNames).toContain("user_id");
      expect(convColumnNames).toContain("title");

      // Check messages table columns
      const { data: msgColumns, error: msgError } = await serviceClient
        .from("information_schema.columns")
        .select("column_name")
        .eq("table_name", "messages")
        .eq("table_schema", "public");

      expect(msgError).toBeNull();
      const msgColumnNames = msgColumns?.map((c) => c.column_name) || [];
      expect(msgColumnNames).toContain("id");
      expect(msgColumnNames).toContain("conversation_id");
      expect(msgColumnNames).toContain("content");
      expect(msgColumnNames).toContain("role");

      // Check images table columns
      const { data: imgColumns, error: imgError } = await serviceClient
        .from("information_schema.columns")
        .select("column_name")
        .eq("table_name", "images")
        .eq("table_schema", "public");

      expect(imgError).toBeNull();
      const imgColumnNames = imgColumns?.map((c) => c.column_name) || [];
      expect(imgColumnNames).toContain("id");
      expect(imgColumnNames).toContain("user_id");
      expect(imgColumnNames).toContain("prompt");
      expect(imgColumnNames).toContain("image_url");
    });
  });

  describe("Row Level Security (RLS) Validation", () => {
    it("should allow anonymous access to profiles but return empty results", async () => {
      if (!hasEnv) {
        console.log("Skipping RLS test - missing environment variables");
        return;
      }

      const { data, error } = await anonClient.from("profiles").select("id");

      // RLS should allow the query but return no results (no auth.uid())
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(0);
    });

    it("should block anonymous inserts to conversations", async () => {
      if (!hasEnv) {
        console.log("Skipping RLS insert test - missing environment variables");
        return;
      }

      const { error } = await anonClient.from("conversations").insert({
        title: "Test Conversation",
        user_id: "00000000-0000-0000-0000-000000000000",
      });

      // Should fail due to RLS policy requiring auth.uid()
      expect(error).toBeTruthy();
      expect(error?.message).toContain("denied");
    });

    it("should block anonymous inserts to messages", async () => {
      if (!hasEnv) {
        console.log(
          "Skipping RLS message test - missing environment variables",
        );
        return;
      }

      const { error } = await anonClient.from("messages").insert({
        conversation_id: "00000000-0000-0000-0000-000000000000",
        content: "Test message",
        role: "user",
      });

      // Should fail due to RLS policy
      expect(error).toBeTruthy();
    });

    it("should block anonymous inserts to images", async () => {
      if (!hasEnv) {
        console.log("Skipping RLS image test - missing environment variables");
        return;
      }

      const { error } = await anonClient.from("images").insert({
        user_id: "00000000-0000-0000-0000-000000000000",
        prompt: "Test prompt",
        image_url: "https://example.com/test.jpg",
        size: "1024x1024",
        model: "dall-e-3",
      });

      // Should fail due to RLS policy
      expect(error).toBeTruthy();
    });
  });

  describe("Data Integrity Validation", () => {
    it("should enforce role constraints on messages table", async () => {
      if (!hasServiceKey) {
        console.log("Skipping constraint test - missing service key");
        return;
      }

      // Try to insert message with invalid role
      const { error } = await serviceClient.from("messages").insert({
        conversation_id: "00000000-0000-0000-0000-000000000000",
        content: "Test message",
        role: "invalid_role" as any,
      });

      // Should fail due to check constraint
      expect(error).toBeTruthy();
      expect(error?.message).toContain("check");
    });

    it("should verify trigger function exists for profile creation", async () => {
      if (!hasServiceKey) {
        console.log("Skipping trigger test - missing service key");
        return;
      }

      // Check if the trigger function exists
      const { data: functions, error } = await serviceClient
        .from("information_schema.routines")
        .select("routine_name")
        .eq("routine_schema", "public")
        .eq("routine_name", "handle_new_user");

      expect(error).toBeNull();
      expect(functions).toBeDefined();
      expect(functions!.length).toBeGreaterThan(0);
    });
  });
});
