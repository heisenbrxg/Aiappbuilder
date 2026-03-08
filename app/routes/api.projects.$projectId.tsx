import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { createSupabaseServerClient } from '~/supabase.server';

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { supabase, headers } = createSupabaseServerClient(request);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  const { projectId } = params;

  if (userError || !user) {
    return json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  if (!projectId) {
    return json({ error: 'Project ID is required' }, { status: 400 });
  }

  // First, verify the user owns the project
  const { data: project, error: fetchError } = await supabase
    .from('user_chats')
    .select('id, user_id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !project) {
    return json({ error: 'Project not found or you do not have permission' }, { status: 404, headers });
  }

  if (request.method === 'DELETE') {
    // First, explicitly delete all snapshots for this chat
    // This ensures RLS policies are properly evaluated
    const { error: snapshotError } = await supabase
      .from('chat_snapshots')
      .delete()
      .eq('chat_id', projectId)
      .eq('user_id', user.id);

    if (snapshotError) {
      console.error('Error deleting snapshots:', snapshotError);
      // Continue anyway - CASCADE should handle it as fallback
    }

    // Then delete the chat itself
    const { error: deleteError } = await supabase
      .from('user_chats')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting project:', deleteError);
      return json({ 
        error: 'Failed to delete project', 
        details: deleteError.message 
      }, { status: 500, headers });
    }

    return json({ 
      success: true,
      deletedProjectId: projectId,
      message: 'Project and all associated data deleted successfully'
    }, { headers });
  }

  if (request.method === 'PATCH') {
    const { description } = (await request.json()) as { description: string };

    if (!description || typeof description !== 'string') {
      return json({ error: 'Description is required and must be a string' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('user_chats')
      .update({ description: description, updated_at: new Date().toISOString() })
      .eq('id', projectId);

    if (updateError) {
      console.error('Error updating project:', updateError);
      return json({ error: 'Failed to update project' }, { status: 500, headers });
    }

    return json({ success: true }, { headers });
  }

  return json({ error: 'Method not allowed' }, { status: 405, headers });
};
