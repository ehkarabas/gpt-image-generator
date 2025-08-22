import { supabase } from '@/lib/supabase/client'
import { z } from 'zod'

const conversationSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  user_id: z.string().uuid(),
  message_count: z.number().int().min(0).default(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

const createConversationSchema = z.object({
  title: z.string().min(1).max(200),
})

const updateConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
})

export const conversationService = {
  async getAll() {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .is('deleted_at', null) // Soft delete filtering
      .order('updated_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch conversations: ${error.message}`)
    }

    return z.array(conversationSchema).parse(data)
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null) // Soft delete filtering
      .single()

    if (error) {
      throw new Error(`Failed to fetch conversation: ${error.message}`)
    }

    return conversationSchema.parse(data)
  },

  async create(input: unknown) {
    const validated = createConversationSchema.parse(input)
    
    const { data, error } = await supabase
      .from('conversations')
      .insert([validated])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create conversation: ${error.message}`)
    }

    return conversationSchema.parse(data)
  },

  async update(id: string, input: unknown) {
    const validated = updateConversationSchema.parse(input)
    
    const { data, error } = await supabase
      .from('conversations')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .is('deleted_at', null) // Soft delete filtering
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update conversation: ${error.message}`)
    }

    return conversationSchema.parse(data)
  },

  async delete(id: string) {
    // Soft delete instead of hard delete
    const { error } = await supabase
      .from('conversations')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .is('deleted_at', null) // Only delete if not already deleted

    if (error) {
      throw new Error(`Failed to delete conversation: ${error.message}`)
    }

    return { success: true }
  },
}