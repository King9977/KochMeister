import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonIcon, IonButton,
  IonList, IonItem, IonLabel, IonCheckbox,
  IonFab, IonFabButton, IonAlert
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  timerOutline, shareOutline, cartOutline,
  trashOutline, chevronBackOutline
} from 'ionicons/icons';
import { Recipe } from '../../interfaces/recipe.interface';
import { SupabaseService } from '../../services/supabase.service';
import { StorageService } from '../../services/storage.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-recipe-detail',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ recipe?.title }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="shareRecipe()">
            <ion-icon name="share-outline" slot="icon-only"></ion-icon>
          </ion-button>
          <ion-button (click)="deleteRecipe()">
            <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="recipe-image">
        <img [src]="recipe?.image || 'assets/placeholder-recipe.jpg'" [alt]="recipe?.title">
      </div>

      <div class="recipe-content">
        <div class="recipe-header">
          <h1>{{ recipe?.title }}</h1>
          <p class="cooking-time">
            <ion-icon name="timer-outline"></ion-icon>
            {{ recipe?.cookingTime }} Minuten
          </p>
        </div>

        <div class="section">
          <h2>Zutaten</h2>
          <ion-list>
            <ion-item *ngFor="let ingredient of recipe?.ingredients">
              <ion-checkbox slot="start"></ion-checkbox>
              <ion-label>
                {{ ingredient.amount }} {{ ingredient.unit }} {{ ingredient.name }}
              </ion-label>
            </ion-item>
          </ion-list>
          <ion-button expand="block" fill="outline" (click)="addToShoppingList()">
            <ion-icon name="cart-outline" slot="start"></ion-icon>
            Zur Einkaufsliste hinzufügen
          </ion-button>
        </div>

        <div class="section">
          <h2>Zubereitung</h2>
          <ol>
            <li *ngFor="let step of recipe?.steps">{{ step }}</li>
          </ol>
        </div>
      </div>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button (click)="startTimer()">
          <ion-icon name="timer-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>

    <ion-alert
      [isOpen]="showTimerAlert"
      header="Timer"
      [message]="timerMessage"
      [buttons]="['OK']"
      (didDismiss)="showTimerAlert = false"
    ></ion-alert>
  `,
  styleUrls: ['./recipe-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonFab,
    IonFabButton,
    IonAlert
  ]
})
export class RecipeDetailPage implements OnInit {
  recipe: Recipe | null = null;
  showTimerAlert = false;
  timerMessage = '';
  timer: any;

  constructor(
    private route: ActivatedRoute,
    private supabaseService: SupabaseService,
    private storageService: StorageService
  ) {
    addIcons({
      timerOutline,
      shareOutline,
      cartOutline,
      trashOutline,
      chevronBackOutline
    });
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      try {
        this.recipe = await this.supabaseService.getRecipe(id);
      } catch (error) {
        console.error('Fehler beim Laden des Rezepts:', error);
      }
    }
  }

  async addToShoppingList() {
    if (this.recipe?.ingredients) {
      const currentList = await this.storageService.getShoppingList();
      const newItems = this.recipe.ingredients.map(ingredient => ({
        ...ingredient,
        checked: false
      }));
      await this.storageService.saveShoppingList([...currentList, ...newItems]);
    }
  }

  startTimer() {
    if (this.recipe?.cookingTime) {
      let timeLeft = this.recipe.cookingTime * 60;
      this.timer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
          clearInterval(this.timer);
          this.timerMessage = 'Timer abgelaufen!';
          this.showTimerAlert = true;
        }
      }, 1000);
    }
  }

  async shareRecipe() {
    if (this.recipe) {
      const shareData = {
        title: this.recipe.title,
        text: `Schau dir dieses leckere Rezept an: ${this.recipe.title}`,
        url: window.location.href
      };
      
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Fehler beim Teilen:', error);
      }
    }
  }

  async deleteRecipe() {
    if (this.recipe?.id) {
      try {
        await this.supabaseService.deleteRecipe(this.recipe.id);
        window.location.href = '/home';
      } catch (error) {
        console.error('Fehler beim Löschen:', error);
      }
    }
  }
}