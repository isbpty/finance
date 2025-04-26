import { supabase } from './supabase';

export async function isAdmin(userId: string): Promise<boolean> {
  try {
    if (!userId) {
      console.error('No user ID provided');
      return false;
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('raw_user_meta_data')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error checking admin status:', userError);
      return false;
    }

    return userData?.raw_user_meta_data?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function promoteToAdmin(userId: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const isCurrentUserAdmin = await isAdmin(session.user.id);
    if (!isCurrentUserAdmin) {
      throw new Error('Not authorized to promote users');
    }

    // Update the users table with new role
    const { error: updateError } = await supabase
      .from('users')
      .update({
        raw_user_meta_data: { role: 'admin' }
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    return { error: null };
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    return { error };
  }
}

export async function demoteFromAdmin(userId: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const isCurrentUserAdmin = await isAdmin(session.user.id);
    if (!isCurrentUserAdmin) {
      throw new Error('Not authorized to demote users');
    }

    // Update the users table with new role
    const { error: updateError } = await supabase
      .from('users')
      .update({
        raw_user_meta_data: { role: 'user' }
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    return { error: null };
  } catch (error) {
    console.error('Error demoting admin:', error);
    return { error };
  }
}

export async function listUsers() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const isCurrentUserAdmin = await isAdmin(session.user.id);
    if (!isCurrentUserAdmin) {
      throw new Error('Not authorized to list users');
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { users: data || [], error: null };
  } catch (error) {
    console.error('Error listing users:', error);
    return { users: [], error };
  }
}

export async function deleteUser(userId: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const isCurrentUserAdmin = await isAdmin(session.user.id);
    if (!isCurrentUserAdmin) {
      throw new Error('Not authorized to delete users');
    }

    // Delete from public.users only
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { error };
  }
}