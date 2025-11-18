// Supabase client disabled - using custom backend API instead
export const supabase = {
  auth: {
    resetPasswordForEmail: async () => ({ error: { message: 'Password recovery not implemented yet' } })
  }
};

export const isSupabaseConfigured = () => false;

