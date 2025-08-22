import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth-helper";

// GET single conversation with chats and messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error: authError } = await getAuthUser(req);
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Get conversation with related messages (no chats table)
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select(`
      *,
      messages (
        id,
        role,
        content,
        message_order,
        created_at
      )
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (convError) {
    if (convError.code === 'PGRST116') {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    console.error('Conversation fetch error:', convError);
    return NextResponse.json({ error: convError.message }, { status: 500 });
  }

  return NextResponse.json(conversation);
}

// PUT update conversation (rename)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error: authError } = await getAuthUser(req);
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  const title = (body?.title?.toString()?.trim() || "").slice(0, 200);

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  // Update conversation title
  const { data, error } = await supabase
    .from("conversations")
    .update({ 
      title,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    console.error('Conversation update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE conversation (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, supabase, error: authError } = await getAuthUser(req);
  
  console.log('🔍 DELETE Debug:', { authError, userId: user?.id });
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  
  console.log('🔍 DELETE Query:', { conversationId: id, userId: user?.id });

  // Test with service role to bypass RLS
  const serviceSupabase = await supabase.auth.admin;
  
  // First, verify conversation exists with regular query
  const { data: existingConv } = await supabase
    .from("conversations")
    .select("id, user_id, deleted_at")
    .eq("id", id);
  
  console.log('🔍 Existing conversation check:', existingConv);

  // Soft delete conversation (cascade will handle chats/messages/images)
  const { data, error } = await supabase
    .from("conversations")
    .update({ 
      deleted_at: new Date().toISOString()
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    console.log('🔍 DELETE Query Result:', { data, error, code: error.code });
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    console.error('Conversation delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, deletedConversation: data });
}