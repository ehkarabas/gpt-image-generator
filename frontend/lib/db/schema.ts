import {
  pgTable,
  text,
  timestamp,
  integer,
  bigint,
  uuid,
  jsonb,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Profiles table (extends Supabase auth.users)
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // References auth.users.id
  email: varchar("email").notNull(),
  displayName: varchar("display_name").notNull().default('User'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// Conversations table
export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  title: varchar("title").notNull().default('New Conversation'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// Messages table  
export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  role: varchar("role").notNull(), // 'user' | 'assistant'
  content: text("content"), // Nullable - image_id varsa metin içermeyebilir
  messageType: varchar("message_type").notNull().default('text'), // 'text' | 'image'
  messageOrder: bigint("message_order", { mode: "number" }).notNull(),
  imageId: uuid("image_id")
    .unique()
    .references(() => images.id, { onDelete: 'set null' }), // One-to-one with images
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// Images table
export const images = pgTable("images", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  prompt: text("prompt").notNull(),
  imageData: text("image_data").notNull(), // Base64 from DALL-E
  imageUrl: text("image_url"), // Alternative URL storage
  dalleResponseMetadata: jsonb("dalle_response_metadata").$type<DalleResponseMetadata>(),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  conversations: many(conversations),
  images: many(images),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(profiles, {
    fields: [conversations.userId],
    references: [profiles.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  image: one(images, {
    fields: [messages.imageId],
    references: [images.id],
  }),
}));

export const imagesRelations = relations(images, ({ one }) => ({
  user: one(profiles, {
    fields: [images.userId],
    references: [profiles.id],
  }),
  message: one(messages, {
    fields: [images.id],
    references: [messages.imageId],
  }),
}));

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
export interface DalleResponseMetadata {
  model?: string;
  size?: string;
  quality?: string;
  style?: string;
  revisedPrompt?: string;
  generationTime?: number;
}