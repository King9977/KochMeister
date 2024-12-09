import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Recipe } from '../interfaces/recipe.interface';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private bucketName = 'recipe-images';
  private initPromise: Promise<void>;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          persistSession: true,
          storage: window.localStorage,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          flowType: 'implicit'
        }
      }
    );

    // Initialize the service and auth state
    this.initPromise = this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      if (error) throw error;

      // Set up auth state change listener
      this.supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          // Clear local storage on sign out
          window.localStorage.removeItem(`sb-${environment.supabaseUrl}-auth-token`);
        }
      });
    } catch (error) {
      console.error('Error initializing Supabase service:', error);
    }
  }

  private async ensureInitialized(): Promise<void> {
    await this.initPromise;
  }

  async getRecipes(): Promise<Recipe[]> {
    await this.ensureInitialized();
    try {
      const { data, error } = await this.supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recipes:', error);
      return [];
    }
  }

  async getRecipe(id: string): Promise<Recipe | null> {
    await this.ensureInitialized();
    try {
      const { data, error } = await this.supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching recipe:', error);
      return null;
    }
  }

  async addRecipe(recipe: Recipe): Promise<Recipe | null> {
    await this.ensureInitialized();
    try {
      const { data, error } = await this.supabase
        .from('recipes')
        .insert({ 
          ...recipe, 
          created_at: new Date().toISOString(),
          ingredients: recipe.ingredients || [],
          steps: recipe.steps || []
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding recipe:', error);
      return null;
    }
  }

  async updateRecipe(id: string, recipe: Partial<Recipe>): Promise<Recipe | null> {
    await this.ensureInitialized();
    try {
      const { data, error } = await this.supabase
        .from('recipes')
        .update({
          ...recipe,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating recipe:', error);
      return null;
    }
  }

  async deleteRecipe(id: string): Promise<boolean> {
    await this.ensureInitialized();
    try {
      const { error } = await this.supabase
        .from('recipes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting recipe:', error);
      return false;
    }
  }

  async uploadImage(file: File): Promise<string | null> {
    await this.ensureInitialized();
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Nur Bilder sind erlaubt');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  }
}