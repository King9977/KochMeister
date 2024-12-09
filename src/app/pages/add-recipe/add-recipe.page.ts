// add-recipe.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonButton, IonIcon,
  IonList, IonItem, IonLabel, IonInput, IonTextarea,
  IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  cameraOutline, addOutline, trashOutline,
  chevronBackOutline, saveOutline 
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Recipe, Ingredient } from '../../interfaces/recipe.interface';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-add-recipe',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Neues Rezept</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="saveRecipe()">
            <ion-icon name="save-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="image-container" (click)="takePicture()">
        <img [src]="recipeImage || 'assets/placeholder-recipe.jpg'" alt="recipe">
        <div class="image-overlay">
          <ion-icon name="camera-outline"></ion-icon>
          <p>Foto hinzufügen</p>
        </div>
      </div>

      <div class="form-container">
        <ion-list>
          <ion-item>
            <ion-label position="stacked">Titel</ion-label>
            <ion-input [(ngModel)]="recipe.title" placeholder="z.B. Spaghetti Bolognese"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Kategorie</ion-label>
            <ion-select [(ngModel)]="recipe.category" placeholder="Wähle eine Kategorie">
              <ion-select-option value="breakfast">Frühstück</ion-select-option>
              <ion-select-option value="main">Hauptgericht</ion-select-option>
              <ion-select-option value="dessert">Dessert</ion-select-option>
              <ion-select-option value="snack">Snack</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Beschreibung</ion-label>
            <ion-textarea
              [(ngModel)]="recipe.description"
              placeholder="Kurze Beschreibung des Gerichts"
              [autoGrow]="true"
            ></ion-textarea>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Kochzeit (Minuten)</ion-label>
            <ion-input
              type="number"
              [(ngModel)]="recipe.cookingTime"
              placeholder="30"
            ></ion-input>
          </ion-item>

          <div class="section-header">
            <h2>Zutaten</h2>
            <ion-button fill="clear" (click)="addIngredient()">
              <ion-icon name="add-outline" slot="icon-only"></ion-icon>
            </ion-button>
          </div>

          <ion-item *ngFor="let ingredient of recipe.ingredients; let i = index">
            <ion-input
              [(ngModel)]="ingredient.amount"
              placeholder="Menge"
              class="amount-input"
            ></ion-input>
            <ion-input
              [(ngModel)]="ingredient.unit"
              placeholder="Einheit"
              class="unit-input"
            ></ion-input>
            <ion-input
              [(ngModel)]="ingredient.name"
              placeholder="Zutat"
              class="name-input"
            ></ion-input>
            <ion-button fill="clear" slot="end" (click)="removeIngredient(i)">
              <ion-icon name="trash-outline" slot="icon-only" color="danger"></ion-icon>
            </ion-button>
          </ion-item>

          <div class="section-header">
            <h2>Zubereitungsschritte</h2>
            <ion-button fill="clear" (click)="addStep()">
              <ion-icon name="add-outline" slot="icon-only"></ion-icon>
            </ion-button>
          </div>

          <ion-item *ngFor="let step of recipe.steps; let i = index">
            <ion-textarea
              [(ngModel)]="recipe.steps[i]"
              placeholder="Schritt beschreiben..."
              [autoGrow]="true"
            ></ion-textarea>
            <ion-button fill="clear" slot="end" (click)="removeStep(i)">
              <ion-icon name="trash-outline" slot="icon-only" color="danger"></ion-icon>
            </ion-button>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  `,
  styleUrls: ['./add-recipe.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption
  ]
})
export class AddRecipePage {
  recipe: Recipe = {
    title: '',
    description: '',
    ingredients: [],
    steps: [],
    cookingTime: 0,
    category: undefined
  };
  recipeImage: string | null = null;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      cameraOutline,
      addOutline,
      trashOutline,
      chevronBackOutline,
      saveOutline
    });
  }

  async takePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      this.recipeImage = image.dataUrl ?? null;
    } catch (error) {
      console.error('Fehler beim Aufnehmen des Fotos:', error);
      this.showToast('Fehler beim Aufnehmen des Fotos');
    }
  }

  addIngredient() {
    this.recipe.ingredients.push({
      amount: '',
      unit: '',
      name: ''
    });
  }

  removeIngredient(index: number) {
    this.recipe.ingredients.splice(index, 1);
  }

  addStep() {
    this.recipe.steps.push('');
  }

  removeStep(index: number) {
    this.recipe.steps.splice(index, 1);
  }

  async saveRecipe() {
    if (!this.recipe.title) {
      await this.showToast('Bitte gib einen Titel ein');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Rezept wird gespeichert...'
    });
    await loading.present();

    try {
      if (this.recipeImage) {
        const response = await fetch(this.recipeImage);
        const blob = await response.blob();
        const file = new File([blob], 'recipe.jpg', { type: 'image/jpeg' });
        
        const imageUrl = await this.supabaseService.uploadImage(file);
        this.recipe.image = imageUrl || undefined;
      }

      await this.supabaseService.addRecipe(this.recipe);
      await loading.dismiss();
      await this.showToast('Rezept erfolgreich gespeichert');
      await this.router.navigate(['/home']);
    } catch (error) {
      await loading.dismiss();
      console.error('Fehler beim Speichern des Rezepts:', error);
      await this.showToast('Fehler beim Speichern des Rezepts');
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }
}