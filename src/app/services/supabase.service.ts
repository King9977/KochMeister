import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Recipe } from '../interfaces/recipe.interface';
import { BehaviorSubject } from 'rxjs';
import { ShoppingListItem } from '../interfaces/recipe.interface';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public supabase: SupabaseClient;
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
        category: recipe.category,
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

  async fetchShoppingList(): Promise<ShoppingListItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('shopping_list_items')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching shopping list:', error);
      return [];
    }
  }

  async addShoppingItem(item: ShoppingListItem): Promise<ShoppingListItem | null> {
    try {
      const { data, error } = await this.supabase
        .from('shopping_list_items')
        .insert([{
          name: item.name,
          amount: item.amount,
          unit: item.unit,
          checked: item.checked,
          created_at: item.createdAt,
          updated_at: item.updatedAt
        }])
        .select()
        .single();
  
      if (error) throw error;
  
      return {
        id: data.id,
        name: data.name,
        amount: data.amount,
        unit: data.unit,
        checked: data.checked,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Artikels zu Supabase:', error);
      return null;
    }
  }

  async updateShoppingList(items: ShoppingListItem[]) {
    try {
      // Formatiere die Items für Supabase
      const formattedItems = items.map(item => ({
        id: item.id,
        name: item.name,
        amount: item.amount,
        unit: item.unit,
        checked: item.checked,
        // Stelle sicher, dass created_at immer einen Wert hat
        created_at: item.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString() // Aktualisiere immer das updated_at Feld
      }));
  
      const { error } = await this.supabase
        .from('shopping_list_items')
        .upsert(formattedItems, {
          onConflict: 'id',
          ignoreDuplicates: false
        });
  
      if (error) throw error;
    } catch (error) {
      console.error('Error updating shopping list:', error);
      throw error;
    }
  }

  async updateShoppingItem(item: ShoppingListItem): Promise<ShoppingListItem | null> {
    try {
      const { data, error } = await this.supabase
        .from('shopping_list_items')
        .update({
          name: item.name,
          amount: item.amount,
          unit: item.unit,
          checked: item.checked,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id)
        .select()
        .single();
  
      if (error) throw error;
      
      return {
        id: data.id,
        name: data.name,
        amount: data.amount,
        unit: data.unit,
        checked: data.checked,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Artikels:', error);
      return null;
    }
  }

  async deleteShoppingItem(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('shopping_list_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting shopping item:', error);
      return false;
    }
  }

  async updateRecipeImage(recipeId: string, imageUrl: string): Promise<Recipe | null> {
  try {
    const { data, error } = await this.supabase
      .from('recipes')
      .update({ image_url: imageUrl })
      .eq('id', recipeId)
      .select()
      .single();

    if (error) {
      console.error('Error updating recipe image:', error);
      return null;
    }

    const updatedRecipe = {
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

    // Update local recipes list
    const currentRecipes = this._recipes.value;
    const index = currentRecipes.findIndex(r => r.id === recipeId);
    if (index !== -1) {
      currentRecipes[index] = updatedRecipe;
      this._recipes.next([...currentRecipes]);
    }

    return updatedRecipe;
  } catch (error) {
    console.error('Error updating recipe image:', error);
    return null;
  }
}

async uploadImage(blob: Blob): Promise<string | null> {
  try {
    // Der Code hier ist bereits gut, prüfen Sie dennoch:
    const fileName = `${Date.now()}.jpg`;
    const filePath = `public/${fileName}`;
    const { error: uploadError } = await this.supabase.storage
      .from(this.bucketName)
      .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });
    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }
    const { data } = this.supabase.storage.from(this.bucketName).getPublicUrl(filePath);
    return data?.publicUrl || null;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error; // Zeigt im Toast eine Nachricht an
  }
}
}