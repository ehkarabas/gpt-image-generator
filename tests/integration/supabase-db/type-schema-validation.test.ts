import { describe, it, expect } from 'vitest'
import type { Database } from '@/lib/types/supabase'
import type { Profile, Conversation, Message, Image } from '@/lib/db/schema'

// Type compatibility tests to ensure TypeScript interfaces match database schema
describe('TypeScript Schema Validation', () => {
  describe('Type Compatibility Checks', () => {
    it('should verify Profile type compatibility', () => {
      // Test that Drizzle schema types are compatible with Supabase types
      const testProfile: Profile = {
        id: 'test-id',
        email: 'test@example.com',
        displayName: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
        preferences: { theme: 'dark' },
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      }

      // Verify the profile has all required fields
      expect(testProfile.id).toBeDefined()
      expect(testProfile.email).toBeDefined()
      expect(testProfile.createdAt).toBeDefined()
      expect(testProfile.updatedAt).toBeDefined()

      // Type assertion to ensure compatibility with Supabase types
      const supabaseProfile: Database['public']['Tables']['profiles']['Row'] = {
        id: testProfile.id,
        email: testProfile.email,
        display_name: testProfile.displayName,
        avatar_url: testProfile.avatar,
        preferences: testProfile.preferences,
        created_at: testProfile.createdAt.toISOString(),
        updated_at: testProfile.updatedAt.toISOString(),
        deleted_at: testProfile.deletedAt?.toISOString() || null
      }

      expect(supabaseProfile).toBeDefined()
    })

    it('should verify Conversation type compatibility', () => {
      const testConversation: Conversation = {
        id: 'conv-id',
        title: 'Test Conversation',
        userId: 'user-id',
        summary: 'A test conversation',
        messageCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      }

      // Verify required fields
      expect(testConversation.id).toBeDefined()
      expect(testConversation.title).toBeDefined()
      expect(testConversation.userId).toBeDefined()

      // Type assertion for Supabase compatibility
      const supabaseConversation: Database['public']['Tables']['conversations']['Row'] = {
        id: testConversation.id,
        title: testConversation.title,
        user_id: testConversation.userId,
        summary: testConversation.summary,
        message_count: testConversation.messageCount,
        created_at: testConversation.createdAt.toISOString(),
        updated_at: testConversation.updatedAt.toISOString(),
        deleted_at: testConversation.deletedAt?.toISOString() || null
      }

      expect(supabaseConversation).toBeDefined()
    })

    it('should verify Message type compatibility', () => {
      const testMessage: Message = {
        id: 'msg-id',
        conversationId: 'conv-id',
        content: 'Test message content',
        role: 'user',
        metadata: { tokens: 10, model: 'gpt-4' },
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      }

      // Verify required fields and role constraint
      expect(testMessage.id).toBeDefined()
      expect(testMessage.conversationId).toBeDefined()
      expect(testMessage.content).toBeDefined()
      expect(['user', 'assistant'].includes(testMessage.role)).toBe(true)

      // Type assertion for Supabase compatibility
      const supabaseMessage: Database['public']['Tables']['messages']['Row'] = {
        id: testMessage.id,
        conversation_id: testMessage.conversationId,
        content: testMessage.content,
        role: testMessage.role,
        metadata: testMessage.metadata,
        created_at: testMessage.createdAt.toISOString(),
        updated_at: testMessage.updatedAt.toISOString(),
        deleted_at: testMessage.deletedAt?.toISOString() || null
      }

      expect(supabaseMessage).toBeDefined()
    })

    it('should verify Image type compatibility', () => {
      const testImage: Image = {
        id: 'img-id',
        userId: 'user-id',
        messageId: 'msg-id',
        prompt: 'A beautiful landscape',
        imageUrl: 'https://example.com/image.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        size: '1024x1024',
        model: 'dall-e-3',
        quality: 'hd',
        style: 'vivid',
        revisedPrompt: 'A stunning landscape with mountains',
        generationTime: 5000,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      }

      // Verify required fields
      expect(testImage.id).toBeDefined()
      expect(testImage.userId).toBeDefined()
      expect(testImage.prompt).toBeDefined()
      expect(testImage.imageUrl).toBeDefined()
      expect(testImage.size).toBeDefined()
      expect(testImage.model).toBeDefined()

      // Type assertion for Supabase compatibility
      const supabaseImage: Database['public']['Tables']['images']['Row'] = {
        id: testImage.id,
        user_id: testImage.userId,
        message_id: testImage.messageId,
        prompt: testImage.prompt,
        image_url: testImage.imageUrl,
        thumbnail_url: testImage.thumbnailUrl,
        size: testImage.size,
        model: testImage.model,
        quality: testImage.quality,
        style: testImage.style,
        revised_prompt: testImage.revisedPrompt,
        generation_time_ms: testImage.generationTime,
        created_at: testImage.createdAt.toISOString(),
        updated_at: testImage.updatedAt.toISOString(),
        deleted_at: testImage.deletedAt?.toISOString() || null
      }

      expect(supabaseImage).toBeDefined()
    })
  })

  describe('Insert Type Validation', () => {
    it('should validate Profile insert types', () => {
      // Test that insert types work correctly
      const profileInsert: Database['public']['Tables']['profiles']['Insert'] = {
        id: 'new-user-id',
        email: 'new@example.com',
        display_name: 'New User'
      }

      expect(profileInsert.id).toBeDefined()
      expect(profileInsert.email).toBeDefined()
      
      // Optional fields should be allowed to be undefined
      const minimalInsert: Database['public']['Tables']['profiles']['Insert'] = {
        id: 'minimal-id',
        email: 'minimal@example.com'
      }

      expect(minimalInsert).toBeDefined()
    })

    it('should validate Conversation insert types', () => {
      const conversationInsert: Database['public']['Tables']['conversations']['Insert'] = {
        title: 'New Conversation',
        user_id: 'user-id'
      }

      expect(conversationInsert.title).toBeDefined()
      expect(conversationInsert.user_id).toBeDefined()
    })

    it('should validate Message insert types', () => {
      const messageInsert: Database['public']['Tables']['messages']['Insert'] = {
        conversation_id: 'conv-id',
        content: 'New message',
        role: 'user'
      }

      expect(messageInsert.conversation_id).toBeDefined()
      expect(messageInsert.content).toBeDefined()
      expect(['user', 'assistant'].includes(messageInsert.role)).toBe(true)
    })

    it('should validate Image insert types', () => {
      const imageInsert: Database['public']['Tables']['images']['Insert'] = {
        user_id: 'user-id',
        prompt: 'A new image',
        image_url: 'https://example.com/new-image.jpg',
        size: '1024x1024',
        model: 'dall-e-3'
      }

      expect(imageInsert.user_id).toBeDefined()
      expect(imageInsert.prompt).toBeDefined()
      expect(imageInsert.image_url).toBeDefined()
      expect(imageInsert.size).toBeDefined()
      expect(imageInsert.model).toBeDefined()
    })
  })

  describe('Update Type Validation', () => {
    it('should validate partial updates work correctly', () => {
      // All fields should be optional in update types
      const profileUpdate: Database['public']['Tables']['profiles']['Update'] = {
        display_name: 'Updated Name'
      }

      const conversationUpdate: Database['public']['Tables']['conversations']['Update'] = {
        title: 'Updated Title',
        message_count: 10
      }

      const messageUpdate: Database['public']['Tables']['messages']['Update'] = {
        content: 'Updated content'
      }

      const imageUpdate: Database['public']['Tables']['images']['Update'] = {
        revised_prompt: 'Updated prompt'
      }

      expect(profileUpdate).toBeDefined()
      expect(conversationUpdate).toBeDefined()
      expect(messageUpdate).toBeDefined()
      expect(imageUpdate).toBeDefined()
    })
  })

  describe('JSON Field Type Safety', () => {
    it('should handle preferences JSON field correctly', () => {
      const preferences = {
        theme: 'dark' as const,
        language: 'en',
        defaultImageSize: '1024x1024' as const,
        autoSaveConversations: true
      }

      const profileWithPrefs: Database['public']['Tables']['profiles']['Insert'] = {
        id: 'prefs-user',
        email: 'prefs@example.com',
        preferences
      }

      expect(profileWithPrefs.preferences).toEqual(preferences)
    })

    it('should handle message metadata JSON field correctly', () => {
      const metadata = {
        tokens: 50,
        model: 'gpt-4',
        temperature: 0.7,
        finishReason: 'stop',
        regenerated: false
      }

      const messageWithMeta: Database['public']['Tables']['messages']['Insert'] = {
        conversation_id: 'conv-id',
        content: 'Message with metadata',
        role: 'assistant',
        metadata
      }

      expect(messageWithMeta.metadata).toEqual(metadata)
    })
  })

  describe('Enum Validation', () => {
    it('should enforce message role enum constraints', () => {
      // Valid roles
      const userMessage: Database['public']['Tables']['messages']['Insert'] = {
        conversation_id: 'conv-id',
        content: 'User message',
        role: 'user'
      }

      const assistantMessage: Database['public']['Tables']['messages']['Insert'] = {
        conversation_id: 'conv-id',
        content: 'Assistant message',
        role: 'assistant'
      }

      expect(userMessage.role).toBe('user')
      expect(assistantMessage.role).toBe('assistant')

      // TypeScript should prevent invalid roles at compile time
      // This would cause a TypeScript error:
      // const invalidMessage: Database['public']['Tables']['messages']['Insert'] = {
      //   conversation_id: 'conv-id',
      //   content: 'Invalid message',
      //   role: 'invalid_role' // TS Error: Type '"invalid_role"' is not assignable
      // }
    })
  })
})