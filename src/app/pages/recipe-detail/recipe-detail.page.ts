import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertController, ModalController } from '@ionic/angular/standalone';
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
    private notificationService: NotificationService,
    private alertController: AlertController,
    private modalCtrl: ModalController
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
      const currentList = await this.storageService.getShoppingList();
      const updatedList = [...currentList, ...selectedIngredients];
      await this.storageService.saveShoppingList(updatedList);
      
      for (const newItem of selectedIngredients) {
        try {
          await this.supabaseService.addShoppingItem(newItem);
        } catch (error) {
          console.error('Fehler beim Online-Speichern:', error);
        }
      }
  
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
    if (!this.recipe?.cookingTime) {
      const alert = await this.alertController.create({
        header: 'Fehler',
        message: 'Keine Kochzeit für dieses Rezept definiert.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }
  
    const minutes = this.recipe.cookingTime;
    const title = this.recipe.title || 'Rezept';
  
    const confirmAlert = await this.alertController.create({
      header: 'Timer starten',
      message: `Möchtest du den Timer für "${title}" starten?\n\nDauer: ${minutes} Minuten`,
      buttons: [
        {
          text: 'Abbrechen',
          role: 'cancel'
        },
        {
          text: 'Timer starten',
          handler: async () => {
            try {
              const notificationScheduled = await this.notificationService.scheduleNotification(
                title,
                minutes
              );
  
              if (notificationScheduled) {
                const successAlert = await this.alertController.create({
                  header: 'Timer gestartet',
                  message: `Timer wurde für ${minutes} Minuten gestellt.`,
                  buttons: ['OK']
                });
                await successAlert.present();
              }
            } catch (error) {
              console.error('Fehler beim Starten des Timers:', error);
              const errorAlert = await this.alertController.create({
                header: 'Fehler',
                message: 'Der Timer konnte nicht gestellt werden. Bitte versuchen Sie es erneut.',
                buttons: ['OK']
              });
              await errorAlert.present();
            }
            return true;
          }
        }
      ]
    });
  
    await confirmAlert.present();
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  handleAlertDismiss() {
    this.showTimerAlert = false;
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