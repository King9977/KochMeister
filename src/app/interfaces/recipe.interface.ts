export interface Recipe {
    id?: string;
    title: string;
    description: string;
    ingredients: Ingredient[];
    steps: string[];
    cookingTime: number;
    image?: string;
    createdAt?: Date;
  }
  
  export interface Ingredient {
    amount: string;
    unit: string;
    name: string;
  }
  
  export interface ShoppingListItem extends Ingredient {
    checked: boolean;
  }