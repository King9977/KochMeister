import { Routes } from '@angular/router';
import { SplashPage } from './pages/splash/splash.page';
import { HomePage } from './pages/home/home.page';

export const routes: Routes = [
  {
    path: '',
    component: SplashPage
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
    path: 'location',
    loadComponent: () => import('./pages/location/location.page').then(m => m.LocationPage)
  },
  {
    path: '**',  // Wildcard route für nicht-existierende Pfade
    redirectTo: '',
    pathMatch: 'full'
  }
];
