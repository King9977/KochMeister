import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Recipe } from '../interfaces/recipe.interface';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private bucketName = 'recipe-images';
  private _recipes = new BehaviorSubject<Recipe[]>([]);
  recipes$ = this._recipes.asObservable();

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
    this.loadInitialRecipes();
  }

  private async loadInitialRecipes() {
    try {
      const recipes = await this.getRecipes();
      this._recipes.next(recipes);
    } catch (error) {
      console.error('Error loading initial recipes:', error);
    }
  }

  async getRecipes(): Promise<Recipe[]> {
    try {
      const { data, error } = await this.supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching recipes:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        ingredients: item.ingredients || [],
        steps: item.steps || [],
        cookingTime: item.cooking_time,
        image: item.image_url,
        category: item.category,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
    } catch (error) {
      console.error('Error fetching recipes:', error);
      return [];
    }
  }

  async getRecipe(id: string): Promise<Recipe | null> {
    try {
      const { data, error } = await this.supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching recipe:', error);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        ingredients: data.ingredients || [],
        steps: data.steps || [],
        cookingTime: data.cooking_time,
        image: data.image_url,
        category: data.category,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error fetching recipe:', error);
      return null;
    }
  }

  async addRecipe(recipe: Recipe): Promise<Recipe | null> {
    try {
      const recipeData = {
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        cooking_time: recipe.cookingTime,
        image_url: recipe.image,
        category: recipe.category
      };

      const { data, error } = await this.supabase
        .from('recipes')
        .insert([recipeData])
        .select()
        .single();

      if (error) {
        console.error('Error inserting recipe:', error);
        return null;
      }

      const newRecipe = {
        id: data.id,
        title: data.title,
        description: data.description,
        ingredients: data.ingredients || [],
        steps: data.steps || [],
        cookingTime: data.cooking_time,
        image: data.image_url,
        category: data.category,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      const currentRecipes = this._recipes.value;
      this._recipes.next([newRecipe, ...currentRecipes]);

      return newRecipe;
    } catch (error) {
      console.error('Error adding recipe:', error);
      return null;
    }
  }

  async deleteRecipe(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('recipes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting recipe:', error);
        return false;
      }

      // Update local recipes list
      const currentRecipes = this._recipes.value;
      this._recipes.next(currentRecipes.filter(recipe => recipe.id !== id));
      
      return true;
    } catch (error) {
      console.error('Error deleting recipe:', error);
      return false;
    }
  }

  async uploadImage(file: File): Promise<string | null> {
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

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return null;
      }

      const { data } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  }
}