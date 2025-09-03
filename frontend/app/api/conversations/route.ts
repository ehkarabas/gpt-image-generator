import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth-helper";

// Vercel timeout configuration
export const maxDuration = 60;
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { user, supabase, error: authError } = await getAuthUser(req);
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  const title = (body?.title?.toString()?.trim() || "New Conversation").slice(0, 200);

  // Yeni schema: userId (camelCase), chats array default []
  const { data, error } = await supabase
    .from("conversations")
    .insert({ 
      title, 
      user_id: user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Conversation creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function GET(req: NextRequest) {
  const { user, supabase, error: authError } = await getAuthUser(req);
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10) || 10));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Yeni schema: userId field, soft delete support
  const { data, error, count } = await supabase
    .from("conversations")
    .select("*", { count: "exact" })
    .eq('user_id', user.id)
    .is('deleted_at', null) // Soft delete filtering
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Conversations fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    data: data ?? [], 
    count: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize)
  });
}