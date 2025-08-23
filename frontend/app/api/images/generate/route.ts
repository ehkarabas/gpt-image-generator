import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/auth-helper'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { user, supabase, error: authError } = await getAuthUser(request);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { prompt, conversationId } = await request.json()

    if (!prompt || !conversationId) {
      return NextResponse.json(
        { error: 'Prompt and conversationId are required' },
        { status: 400 }
      )
    }

    // Generate image with DALL-E
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url',
    })

    const imageUrl = response.data?.[0]?.url
    if (!imageUrl) {
      throw new Error('No image URL received from OpenAI')
    }

    // Store image in database first
    const { data: image, error: imageError } = await supabase
      .from('images')
      .insert({
        user_id: user.id,
        prompt: prompt,
        image_url: imageUrl,
        image_data: imageUrl, // Store URL in both fields for compatibility
        dalle_response_metadata: {
          ...(response.data?.[0] || {}),
          model: 'dall-e-3',
          size: '1024x1024',
          quality: 'standard',
          generationTime: Date.now()
        },
      })
      .select()
      .single()

    if (imageError) {
      console.error('Image creation error:', imageError)
      return NextResponse.json(
        { error: 'Failed to store image' },
        { status: 500 }
      )
    }

    // Create assistant message with image URL as content
    const { data: assistantMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: imageUrl, // Store URL directly in content for easier display
        role: 'assistant',
        message_type: 'image',
        image_id: image.id,
        message_order: Date.now(), // Will be updated by proper ordering logic
      })
      .select()
      .single()

    if (messageError) {
      console.error('Message creation error:', messageError)
      // Clean up the image if message creation fails
      await supabase.from('images').delete().eq('id', image.id)
      return NextResponse.json(
        { error: 'Failed to create message' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: assistantMessage.id,
      conversationId: conversationId,
      role: assistantMessage.role,
      content: assistantMessage.content,
      messageType: assistantMessage.message_type,
      imageId: assistantMessage.image_id,
      createdAt: assistantMessage.created_at,
      image: {
        id: image.id,
        prompt: image.prompt,
        imageUrl: image.image_url,
        imageData: image.image_data,
        createdAt: image.created_at,
      },
    })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}