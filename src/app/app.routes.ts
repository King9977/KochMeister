// app.routes.ts
import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home.page';

export const routes: Routes = [
  {
    path: '',
    component: HomePage
  },
  {
    path: 'home',
    component: HomePage
  },
  {
    path: 'recipe-detail/:id',
    loadComponent: () => import('./pages/recipe-detail/recipe-detail.page').then(m => m.RecipeDetailPage)
  },
  {
    path: 'add-recipe',
    loadComponent: () => import('./pages/add-recipe/add-recipe.page').then(m => m.AddRecipePage)
  },
  {
    path: 'shopping-list',
    loadComponent: () => import('./pages/shopping-list/shopping-list.page').then(m => m.ShoppingListPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage)
  },
  {
    path: '**',  // Wildcard route für nicht-existierende Pfade
    redirectTo: '',
    pathMatch: 'full'
  }
];