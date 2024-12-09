// interfaces/recipe.interface.ts
export interface Recipe {
  id?: string;
  title: string;
  description?: string;
  ingredients: Ingredient[];
  steps: string[];
  cookingTime: number;
  image?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

export interface Ingredient {
  amount: string;
  unit: string;
  name: string;
}

export interface UserSettings {
  id?: string;
  userId: string;
  darkMode: boolean;
  notificationsEnabled: boolean;
  language: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShoppingList {
  id?: string;
  userId: string;
  name: string;
  items: ShoppingListItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ShoppingListItem {
  id?: string;
  name: string;
  amount?: string;
  unit?: string;
  checked: boolean;
  createdAt?: string;
  updatedAt?: string;
}