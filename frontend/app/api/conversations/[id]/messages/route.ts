import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/auth-helper';

// GET - Fetch messages for a conversation
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase, error: authError } = await getAuthUser(req);
    const { id: conversationId } = await params;
    
    // Get cursor and limit from query params
    const url = new URL(req.url);
    const cursor = url.searchParams.get('cursor');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    
    // Verify user authentication
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify conversation ownership
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id, user_id")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Messages directly connect to conversation - no chats table

    // Build query for messages
    let query = supabase
      .from("messages")
      .select("*, message_type")
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit + 1); // +1 to check if there are more

    // Apply cursor pagination if provided
    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: messages, error: msgError } = await query;

    if (msgError) {
      console.error('Messages fetch error:', msgError);
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }

    const hasMore = messages.length > limit;
    const finalMessages = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? finalMessages[finalMessages.length - 1].created_at : null;

    // Transform to expected format
    const transformedMessages = finalMessages.map(msg => ({
      id: msg.id,
      conversationId,
      role: msg.role,
      content: msg.content,
      messageType: msg.message_type || 'text',
      created_at: msg.created_at, // Keep as ISO string
      metadata: msg.metadata || {}
    }));

    return NextResponse.json({
      messages: transformedMessages,
      nextCursor,
      hasMore
    });

  } catch (error) {
    console.error('Fetch messages error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Send a message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase, error: authError } = await getAuthUser(req);
    const { id: conversationId } = await params;
    
    // Verify user authentication
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { content, role = 'user' } = await req.json();
    
    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    // Verify conversation ownership
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id, user_id")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // No chats table - messages directly reference conversation_id

    // Insert user message
    const { data: userMessage, error: msgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role,
        content: content.trim(),
        message_type: 'text', // User messages are always text
        message_order: Date.now(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (msgError) {
      console.error('Message insert error:', msgError);
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    // Only generate AI response for user messages
    if (role === 'user') {
      try {
        // Import OpenAI service
        const { OpenAIService } = await import('@/lib/services/openai-service');
        const openaiService = new OpenAIService();
        
        // Get conversation history for context
        const { data: previousMessages } = await supabase
          .from("messages")
          .select("role, content")
          .eq("conversation_id", conversationId)
          .is("deleted_at", null)
          .order("created_at", { ascending: true });

        // Prepare messages for OpenAI
        const messages = (previousMessages || []).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }));

        let aiResponse: string;
        let messageType = 'text';
        let savedImage: any = null;

        // Check if this is an image generation request
        if (OpenAIService.isImageGenerationRequest(content)) {
          // Generate image
          const imagePrompt = OpenAIService.extractImagePrompt(content);
          console.log('Generating image for prompt:', imagePrompt);
          
          try {
            const imageUrl = await openaiService.generateImage(imagePrompt, {
              model: 'dall-e-3',
              size: '1024x1024',
              quality: 'standard',
              style: 'vivid'
            });
            
            // Save image to images table for gallery
            const { data: savedImage, error: imageInsertError } = await supabase
              .from('images')
              .insert({
                user_id: user.id,
                prompt: imagePrompt,
                image_data: imageUrl, // Store URL as image_data since it's required
                image_url: imageUrl,
                dalle_response_metadata: {
                  model: 'dall-e-3',
                  size: '1024x1024',
                  quality: 'standard',
                  style: 'vivid',
                  generationTime: Date.now()
                },
                created_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (imageInsertError) {
              console.error('Image gallery save error:', imageInsertError);
              // Don't fail the response, just log the error
            }
            
            aiResponse = imageUrl;
            messageType = 'image';
          } catch (imageError) {
            console.error('Image generation failed:', imageError);
            // Fallback to text response explaining the issue
            aiResponse = `I apologize, but I couldn't generate an image for that request. ${imageError instanceof Error ? imageError.message : 'Please try with a different prompt.'}`;
            messageType = 'text';
          }
        } else {
          // Generate text response
          aiResponse = await openaiService.generateChatResponse(messages, {
            model: 'gpt-4o-mini',
            maxTokens: 1000,
            temperature: 0.7
          });
        }

        // Insert AI response
        const { data: aiMessage, error: aiMsgError } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: aiResponse,
            message_type: messageType,
            image_id: savedImage?.id || null, // Link to the saved image
            message_order: Date.now(),
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (aiMsgError) {
          console.error('AI message insert error:', aiMsgError);
          // Don't fail the request if AI response fails to save
        }

        // Update conversation's updatedAt
        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId);

        // Return both user message and AI response
        return NextResponse.json({
          userMessage,
          aiMessage: aiMessage || null,
          success: true
        });

      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError);
        
        // Insert error message as AI response
        const errorMessage = openaiError instanceof Error 
          ? `I apologize, but I encountered an error: ${openaiError.message}`
          : 'I apologize, but I encountered an unexpected error. Please try again.';

        const { data: errorAiMessage } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: errorMessage,
            message_type: 'text', // Error messages are text
            message_order: Date.now(),
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        // Update conversation's updatedAt
        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId);

        return NextResponse.json({
          userMessage,
          aiMessage: errorAiMessage || null,
          success: true,
          warning: 'AI response failed'
        });
      }
    } else {
      // For non-user messages, just return the message
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      return NextResponse.json({
        userMessage,
        aiMessage: null,
        success: true
      });
    }

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}