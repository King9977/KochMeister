import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { Recipe, Ingredient, ShoppingListItem } from '../../interfaces/recipe.interface';
import { SupabaseService } from '../../services/supabase.service';
import { StorageService } from '../../services/storage.service';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../services/notification.service';

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
            <ion-item *ngFor="let ingredient of recipe?.ingredients; let i = index">
              <ion-checkbox 
                slot="start" 
                [(ngModel)]="ingredient.isSelected"
                (ionChange)="updateIngredientSelection(i, $event)">
              </ion-checkbox>
              <ion-label>
                {{ ingredient.amount }} {{ ingredient.unit }} {{ ingredient.name }}
              </ion-label>
            </ion-item>
          </ion-list>
          <ion-button expand="block" fill="outline" (click)="addSelectedToShoppingList()">
            <ion-icon name="cart-outline" slot="start"></ion-icon>
            Ausgewählte zur Einkaufsliste hinzufügen
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
    (didDismiss)="handleAlertDismiss()"
></ion-alert>
  `,
  styleUrls: ['./recipe-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
export class RecipeDetailPage implements OnInit, OnDestroy {
  recipe: Recipe | null = null;
  showTimerAlert = false;
  timerMessage = '';
  timer: any;

  constructor(
    private route: ActivatedRoute,
    private supabaseService: SupabaseService,
    private storageService: StorageService,
    private notificationService: NotificationService
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
        if (this.recipe?.ingredients) {
          this.recipe.ingredients = this.recipe.ingredients.map(ingredient => ({
            ...ingredient,
            isSelected: false
          }));
        }
      } catch (error) {
        console.error('Fehler beim Laden des Rezepts:', error);
      }
    }
  }

  updateIngredientSelection(index: number, event: any) {
    if (this.recipe?.ingredients) {
      this.recipe.ingredients[index] = {
        ...this.recipe.ingredients[index],
        isSelected: event.detail.checked
      };
    }
  }

  async addSelectedToShoppingList() {
    if (!this.recipe?.ingredients) return;
  
    const selectedIngredients = this.recipe.ingredients
      .filter(ingredient => ingredient.isSelected)
      .map(ingredient => ({
        name: ingredient.name,
        amount: ingredient.amount,
        unit: ingredient.unit,
        checked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
  
    if (selectedIngredients.length === 0) return;
  
    try {
      // Hole aktuelle Liste
      const currentList = await this.storageService.getShoppingList();
      
      // Füge neue Items direkt zur Liste hinzu ohne Duplikatprüfung
      const updatedList = [...currentList, ...selectedIngredients];
      
      // Speichere in lokalem Storage
      await this.storageService.saveShoppingList(updatedList);
      
      // Speichere jedes neue Item in Supabase
      for (const newItem of selectedIngredients) {
        try {
          await this.supabaseService.addShoppingItem(newItem);
        } catch (error) {
          console.error('Fehler beim Online-Speichern:', error);
        }
      }
  
      // Reset selections
      if (this.recipe?.ingredients) {
        this.recipe.ingredients = this.recipe.ingredients.map(ingredient => ({
          ...ingredient,
          isSelected: false
        }));
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Einkaufsliste:', error);
    }
  }

  async startTimer() {
    if (this.recipe?.cookingTime) {
      // Erst alten Timer aufräumen falls vorhanden
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }

      const minutes = this.recipe.cookingTime;
      const title = this.recipe.title || 'Rezept';
      let timeLeft = minutes * 60;
      
      try {
        // Timer im UI starten
        this.timer = setInterval(() => {
          timeLeft--;
          if (timeLeft <= 0) {
            clearInterval(this.timer);
            this.timer = null;
            this.timerMessage = 'Timer abgelaufen!';
            this.showTimerAlert = true;
          }
        }, 1000);

        // Notification planen
        const notificationScheduled = await this.notificationService.scheduleNotification(
          title,
          minutes * 60
        );

        if (!notificationScheduled) {
          console.log('Benachrichtigungen nicht verfügbar - nur UI Timer wird verwendet');
        }
      } catch (error) {
        console.error('Fehler beim Starten des Timers:', error);
      }
    }
  }

  // Wichtig: Timer aufräumen wenn die Komponente zerstört wird
  ngOnDestroy(): void {  // void Return type hinzufügen
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // Alert Handler hinzufügen
  handleAlertDismiss() {
    this.showTimerAlert = false;
    // Sicherstellen dass der Timer gestoppt ist
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
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