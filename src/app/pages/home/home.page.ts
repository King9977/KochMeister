import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButton, IonIcon, IonSearchbar, IonCard, 
  IonCardHeader, IonCardTitle, IonCardSubtitle,
  IonRefresher, IonRefresherContent,
  IonTabBar, IonTabButton, IonLabel 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  addOutline, searchOutline, timeOutline, 
  restaurantOutline, listOutline, settingsOutline, 
  cloudOfflineOutline 
} from 'ionicons/icons';
import { Recipe } from '../../interfaces/recipe.interface';
import { SupabaseService } from '../../services/supabase.service';
import { StorageService } from '../../services/storage.service';
import { Network } from '@capacitor/network';

@Component({
  selector: 'app-home',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Meine Rezepte</ion-title>
        <ion-button slot="end" fill="clear" (click)="navigateToAddRecipe()">
          <ion-icon name="add-outline" slot="icon-only"></ion-icon>
        </ion-button>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          [debounce]="500"
          (ionInput)="handleSearch($event)"
          placeholder="Rezepte suchen..."
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="recipe-grid">
        <ion-card *ngFor="let recipe of filteredRecipes" (click)="openRecipe(recipe)">
          <img [src]="recipe.image || 'assets/placeholder-recipe.jpg'" alt="recipe image"/>
          <ion-card-header>
            <ion-card-title>{{ recipe.title }}</ion-card-title>
            <ion-card-subtitle>
              <ion-icon name="time-outline"></ion-icon>
              {{ recipe.cookingTime }} Min.
            </ion-card-subtitle>
          </ion-card-header>
        </ion-card>
      </div>

      <div *ngIf="!isOnline" class="offline-banner">
        <ion-icon name="cloud-offline-outline"></ion-icon>
        <p>Offline Modus - Nur gespeicherte Rezepte verfügbar</p>
      </div>
    </ion-content>

    <ion-tab-bar slot="bottom">
      <ion-tab-button tab="home" selected>
        <ion-icon name="restaurant-outline"></ion-icon>
        <ion-label>Rezepte</ion-label>
      </ion-tab-button>
      <ion-tab-button tab="shopping-list" [routerLink]="['/shopping-list']">
        <ion-icon name="list-outline"></ion-icon>
        <ion-label>Einkaufsliste</ion-label>
      </ion-tab-button>
      <ion-tab-button tab="settings" [routerLink]="['/settings']">
        <ion-icon name="settings-outline"></ion-icon>
        <ion-label>Einstellungen</ion-label>
      </ion-tab-button>
    </ion-tab-bar>
  `,
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonRefresher,
    IonRefresherContent,
    IonTabBar,
    IonTabButton,
    IonLabel
  ]
})
export class HomePage implements OnInit {
  recipes: Recipe[] = [];
  filteredRecipes: Recipe[] = [];
  isOnline: boolean = true;

  constructor(
    private supabaseService: SupabaseService,
    private storageService: StorageService
  ) {
    addIcons({
      addOutline,
      timeOutline,
      cloudOfflineOutline,
      restaurantOutline,
      listOutline,
      settingsOutline,
      searchOutline
    });
  }

  async ngOnInit() {
    await this.checkNetworkStatus();
    await this.loadRecipes();
  }

  async checkNetworkStatus() {
    const status = await Network.getStatus();
    this.isOnline = status.connected;
    
    Network.addListener('networkStatusChange', status => {
      this.isOnline = status.connected;
      this.loadRecipes();
    });
  }

  async loadRecipes() {
    try {
      if (this.isOnline) {
        this.recipes = await this.supabaseService.getRecipes();
        await this.storageService.saveOfflineRecipes(this.recipes);
      } else {
        this.recipes = await this.storageService.getOfflineRecipes();
      }
      this.filteredRecipes = [...this.recipes];
    } catch (error) {
      console.error('Fehler beim Laden der Rezepte:', error);
    }
  }

  handleSearch(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredRecipes = this.recipes.filter(recipe => 
      recipe.title.toLowerCase().includes(query) ||
      recipe.description?.toLowerCase().includes(query)
    );
  }

  async handleRefresh(event: any) {
    await this.loadRecipes();
    event.target.complete();
  }

  navigateToAddRecipe() {
    window.location.href = '/add-recipe';
  }

  openRecipe(recipe: Recipe) {
    window.location.href = `/recipe-detail/${recipe.id}`;
  }
}