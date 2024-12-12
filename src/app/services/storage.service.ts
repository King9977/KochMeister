// storage.service.ts
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Recipe, ShoppingListItem } from '../interfaces/recipe.interface';
import { BehaviorSubject } from 'rxjs';
import { Platform } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private _storage: Storage | null = null;
  private initialized = false;
  private readonly SHOPPING_LIST_KEY = 'shopping_list';
  private readonly DARK_MODE_KEY = 'darkmode';
  private readonly RECIPES_KEY = 'offline_recipes';
  
  private _offlineRecipes = new BehaviorSubject<Recipe[]>([]);
  offlineRecipes$ = this._offlineRecipes.asObservable();

  constructor(
    private storage: Storage,
    private platform: Platform
  ) {
    this.init();
  }

  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    // Initialize storage
    this._storage = await this.storage.create();
    this.initialized = true;
    
    // Load initial offline recipes
    const recipes = await this.getOfflineRecipes();
    this._offlineRecipes.next(recipes);
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized || !this._storage) {
      await this.init();
    }
  }

  // Dark Mode Methods
  async setDarkMode(isDark: boolean): Promise<void> {
    try {
      await Preferences.set({
        key: this.DARK_MODE_KEY,
        value: isDark.toString()
      });
    } catch (error) {
      console.error('Error saving dark mode setting:', error);
      throw error;
    }
  }

  async getDarkMode(): Promise<boolean> {
    try {
      const { value } = await Preferences.get({ key: this.DARK_MODE_KEY });
      return value === 'true';
    } catch (error) {
      console.error('Error loading dark mode setting:', error);
      return false;
    }
  }

  // Shopping List Methods
  async saveShoppingList(list: ShoppingListItem[]): Promise<void> {
    await this.ensureInitialized();
    try {
      await this._storage?.set(this.SHOPPING_LIST_KEY, list);
    } catch (error) {
      console.error('Error saving shopping list:', error);
      throw error;
    }
  }

  async getShoppingList(): Promise<ShoppingListItem[]> {
    await this.ensureInitialized();
    try {
      return await this._storage?.get(this.SHOPPING_LIST_KEY) || [];
    } catch (error) {
      console.error('Error loading shopping list:', error);
      return [];
    }
  }

  async clearShoppingList(): Promise<void> {
    await this.ensureInitialized();
    try {
      await this._storage?.remove(this.SHOPPING_LIST_KEY);
    } catch (error) {
      console.error('Error clearing shopping list:', error);
      throw error;
    }
  }

  // Recipe Methods
  async saveRecipe(recipe: Recipe): Promise<void> {
    await this.ensureInitialized();
    try {
      const recipes = await this.getOfflineRecipes();
      recipes.push(recipe);
      await this._storage?.set(this.RECIPES_KEY, recipes);
      this._offlineRecipes.next(recipes);
    } catch (error) {
      console.error('Error saving recipe:', error);
      throw error;
    }
  }

  async getOfflineRecipes(): Promise<Recipe[]> {
    await this.ensureInitialized();
    try {
      return await this._storage?.get(this.RECIPES_KEY) || [];
    } catch (error) {
      console.error('Error loading offline recipes:', error);
      return [];
    }
  }

  async getSavedRecipesCount(): Promise<number> {
    const recipes = await this.getOfflineRecipes();
    return recipes.length;
  }

  async clearAllData(): Promise<void> {
    await this.ensureInitialized();
    try {
      await this._storage?.clear();
      this._offlineRecipes.next([]);
      // Clear Preferences data as well
      await Preferences.clear();
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }
}