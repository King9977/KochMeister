// services/storage.service.ts
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Recipe, ShoppingListItem } from '../interfaces/recipe.interface';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private _storage: Storage | null = null;
  private SHOPPING_LIST_KEY = 'shoppingList';

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

  async saveShoppingList(list: ShoppingListItem[]): Promise<void> {
    if (this._storage) {
      await this._storage.set(this.SHOPPING_LIST_KEY, list);
    } else {
      localStorage.setItem(this.SHOPPING_LIST_KEY, JSON.stringify(list));
    }
  }

  async getShoppingList(): Promise<ShoppingListItem[]> {
    if (this._storage) {
      return await this._storage.get(this.SHOPPING_LIST_KEY) || [];
    }
    const data = localStorage.getItem(this.SHOPPING_LIST_KEY);
    return data ? JSON.parse(data) : [];
  }

  async clearShoppingList(): Promise<void> {
    if (this._storage) {
      await this._storage.remove(this.SHOPPING_LIST_KEY);
    } else {
      localStorage.removeItem(this.SHOPPING_LIST_KEY);
    }
  }

  async setDarkMode(isDark: boolean) {
    return this._storage?.set('dark_mode', isDark);
  }

  async getDarkMode(): Promise<boolean> {
    return this._storage?.get('dark_mode') || false;
  }
}