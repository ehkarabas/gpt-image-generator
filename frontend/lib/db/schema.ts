import {
  pgTable,
  text,
  timestamp,
  integer,
  uuid,
  jsonb,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Base timestamps mixin
const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
};

// Profiles table (extends Supabase auth.users)
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // References auth.users.id
  email: text("email").notNull(),
  displayName: text("display_name"),
  avatar: text("avatar_url"),
  preferences: jsonb("preferences").$type<UserPreferences | null>(),
  ...timestamps,
});

// Conversations table
export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  userId: uuid("user_id").notNull(),
  summary: text("summary"),
  messageCount: integer("message_count").default(0),
  ...timestamps,
});

// Messages table
export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").notNull(),
  content: text("content").notNull(),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  metadata: jsonb("metadata").$type<MessageMetadata | null>(),
  ...timestamps,
});

// Images table
export const images = pgTable("images", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  messageId: uuid("message_id"),
  prompt: text("prompt").notNull(),
  imageUrl: text("image_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  size: varchar("size", { length: 20 }).notNull(), // "1024x1024"
  model: varchar("model", { length: 20 }).notNull(), // "dall-e-3"
  quality: varchar("quality", { length: 10 }), // "standard" | "hd"
  style: varchar("style", { length: 20 }), // "vivid" | "natural"
  revisedPrompt: text("revised_prompt"),
  generationTime: integer("generation_time_ms"),
  ...timestamps,
});

// Relations (declared without explicit FK helpers to keep Drizzle optional)
export const profilesRelations = relations(profiles, ({ many }) => ({
  conversations: many(conversations),
  images: many(images),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ many }) => ({
  images: many(images),
}));

export const imagesRelations = relations(images, ({}) => ({}));

// Infer types from schema
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;

// Custom types for metadata
export interface UserPreferences {
  theme?: "light" | "dark" | "system";
  language?: string;
  defaultImageSize?: "1024x1024" | "1792x1024" | "1024x1792";
  defaultImageModel?: "dall-e-2" | "dall-e-3";
  defaultImageQuality?: "standard" | "hd";
  autoSaveConversations?: boolean;
}

export interface MessageMetadata {
  tokens?: number;
  model?: string;
  temperature?: number;
  finishReason?: string;
  regenerated?: boolean;
  editedAt?: string;
}
