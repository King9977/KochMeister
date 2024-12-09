import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Recipe, ShoppingListItem } from '../interfaces/recipe.interface';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private _storage: Storage | null = null;

  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    const storage = await this.storage.create();
    this._storage = storage;
  }

  async saveOfflineRecipes(recipes: Recipe[]) {
    return this._storage?.set('offline_recipes', recipes);
  }

  async getOfflineRecipes(): Promise<Recipe[]> {
    return this._storage?.get('offline_recipes') || [];
  }

  async saveShoppingList(items: ShoppingListItem[]) {
    return this._storage?.set('shopping_list', items);
  }

  async getShoppingList(): Promise<ShoppingListItem[]> {
    return this._storage?.get('shopping_list') || [];
  }

  async setDarkMode(isDark: boolean) {
    return this._storage?.set('dark_mode', isDark);
  }

  async getDarkMode(): Promise<boolean> {
    return this._storage?.get('dark_mode') || false;
  }
}