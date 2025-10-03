// 🎓 REACT CONCEPT: Custom hook for profile management
// In SwiftUI: @StateObject private var profileManager = ProfileManager()
// In React: const { profile, updateProfile, loading } = useProfile()

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { HeightUnit, WeightUnit } from '../utils/unitConversions';

export interface UserProfile {
  user_id: string;
  display_name?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  unit_preference: 'ml' | 'oz' | 'cup' | 'bottle';
  height_unit: HeightUnit;
  weight_unit: WeightUnit;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🎓 REACT CONCEPT: useEffect for loading profile data
  // In SwiftUI: onAppear { loadProfile() }
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found, create a default one
          await createDefaultProfile(user.id);
          return;
        }
        throw error;
      }

      setProfile(data);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          display_name: null,
          height_cm: null,
          weight_kg: null,
          unit_preference: 'ml',
          height_unit: 'cm',
          weight_unit: 'kg',
          timezone: 'America/New_York',
        })
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error creating default profile:', err);
      setError('Failed to create profile');
    }
  };

  const updateProfile = async (updates: Partial<Omit<UserProfile, 'user_id' | 'created_at' | 'updated_at'>>) => {
    try {
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .upsert({ user_id: user.id, ...updates })
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return data;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    }
  };

  const isProfileComplete = (): boolean => {
    if (!profile) return false;
    return !!(profile.display_name && profile.height_cm && profile.weight_kg);
  };

  const getProfileCompletionPercentage = (): number => {
    if (!profile) return 0;
    
    let completed = 0;
    const total = 3; // display_name, height_cm, weight_kg
    
    if (profile.display_name) completed++;
    if (profile.height_cm) completed++;
    if (profile.weight_kg) completed++;
    
    return Math.round((completed / total) * 100);
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile: loadProfile,
    isProfileComplete,
    getProfileCompletionPercentage,
  };
}
