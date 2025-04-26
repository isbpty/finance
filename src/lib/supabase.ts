import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-v2'
    }
  },
  db: {
    schema: 'public'
  }
});

export async function signInWithEmail(email: string, password: string) {
  try {
    if (!supabase.auth) {
      throw new Error('Authentication service not available');
    }

    // Clear any existing auth data before signing in
    localStorage.removeItem('supabase.auth.token');
    await supabase.auth.signOut();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      let userMessage = 'An error occurred during sign in';
      
      switch (error.message) {
        case 'Invalid login credentials':
          userMessage = 'The email or password you entered is incorrect';
          break;
        case 'Invalid email or password':
        case 'User not found':
          userMessage = 'No account found with this email address';
          break;
        default:
          userMessage = error.message;
      }

      throw new Error(userMessage);
    }

    // After successful login, check if session was created
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('Failed to establish session');
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Sign in error:', error.message);
    return { 
      data: null, 
      error: {
        message: error.message || 'An error occurred during sign in',
        status: error?.status || 500
      }
    };
  }
}

export async function signUpWithEmail(email: string, password: string) {
  try {
    if (!supabase.auth) {
      throw new Error('Authentication service not available');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'user' // Set default role for new users
        }
      }
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Sign up error:', error.message);
    return { 
      data: null, 
      error: {
        message: error.message || 'An error occurred during sign up',
        status: error?.status || 500
      }
    };
  }
}

export async function resetPassword(email: string) {
  try {
    if (!supabase.auth) {
      throw new Error('Authentication service not available');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Password reset error:', error.message);
    return { 
      error: {
        message: error.message || 'An error occurred during password reset',
        status: error?.status || 500
      }
    };
  }
}

export async function updatePassword(password: string) {
  try {
    if (!supabase.auth) {
      throw new Error('Authentication service not available');
    }

    const { data, error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Password update error:', error.message);
    return {
      data: null,
      error: {
        message: error.message || 'An error occurred during password update',
        status: error?.status || 500
      }
    };
  }
}

export async function signOut() {
  try {
    if (!supabase.auth) {
      throw new Error('Authentication service not available');
    }

    // Clear auth data from localStorage first
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('supabase.auth.refreshToken');
    
    // Then sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    return { error: null };
  } catch (error: any) {
    console.error('Sign out error:', error.message);
    return { 
      error: {
        message: error.message || 'An error occurred during sign out',
        status: error?.status || 500
      }
    };
  }
}

export async function getCurrentUser() {
  try {
    if (!supabase.auth) {
      throw new Error('Authentication service not available');
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error(`Session error: ${sessionError.message}`);
    }

    if (!session) {
      return { user: null, error: null };
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Get user error:', userError);
      throw new Error(`User error: ${userError.message}`);
    }

    // Get additional user data including role
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('raw_user_meta_data')
      .eq('id', user.id)
      .single();

    if (userDataError) {
      console.error('User data error:', userDataError);
      throw new Error(`User data error: ${userDataError.message}`);
    }

    return { 
      user: {
        ...user,
        role: userData?.raw_user_meta_data?.role || 'user'
      }, 
      error: null 
    };
  } catch (error: any) {
    console.error('Get current user error:', error);
    return { 
      user: null, 
      error: {
        message: error.message || 'An error occurred while getting user information',
        status: error?.status || 500
      }
    };
  }
}