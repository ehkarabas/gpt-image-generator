import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/auth-helper';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const id = params.id;

  console.log('[ACTIONS POST] Route handler called for conversation:', id);

  try {
    const { user, supabase, error: authError } = await getAuthUser(request);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // DELETE action handler (soft delete)
    if (action === 'delete') {
      console.log(`[ACTIONS POST DELETE] Soft deleting conversation ${id} for user ${user.id}`);

      // Conversation'ın var olduğunu ve user'a ait olduğunu kontrol et
      const { data: conversation, error: fetchError } = await supabase
        .from('conversations')
        .select('id, user_id')
        .eq('id', id)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single();

      if (fetchError || !conversation) {
        console.log('[ACTIONS POST DELETE] Conversation not found:', fetchError?.message);
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      // Soft delete conversation (cascade will handle related records)
      const { data, error } = await supabase
        .from('conversations')
        .update({ 
          deleted_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .select()
        .single();

      if (error) {
        console.log('[ACTIONS POST DELETE] Database error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log(`[ACTIONS POST DELETE] Successfully soft deleted conversation ${id}`);
      return NextResponse.json({ success: true, deletedConversation: data });
    }

    // RENAME action handler
    if (action === 'rename') {
      const { title } = body;
      const cleanTitle = (title?.toString()?.trim() || "").slice(0, 200);

      if (!cleanTitle) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 });
      }

      console.log(`[ACTIONS POST RENAME] Renaming conversation ${id} to "${cleanTitle}"`);

      const { data, error } = await supabase
        .from('conversations')
        .update({ 
          title: cleanTitle,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .select()
        .single();

      if (error) {
        console.log('[ACTIONS POST RENAME] Database error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log(`[ACTIONS POST RENAME] Successfully renamed conversation ${id}`);
      return NextResponse.json({ success: true, conversation: data });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (err: unknown) {
    console.error('[ACTIONS POST] Error:', err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Internal server error'
    }, { status: 500 });
  }
}