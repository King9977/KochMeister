// interfaces/recipe.interface.ts
export interface Recipe {
  id?: string;
  title: string;
  description: string;
  image?: string;
  category?: string;
  cookingTime: number;
  ingredients: Ingredient[];
  steps: string[];
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
  isOffline?: boolean;
}
export interface Ingredient {
  amount: string;
  unit: string;
  name: string;
  isSelected?: boolean;  // Added this property
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

export interface ShoppingListItem {
  id?: string;
  name: string;
  amount?: string;
  unit?: string;
  checked: boolean;
  createdAt?: string;
  updatedAt?: string;
}