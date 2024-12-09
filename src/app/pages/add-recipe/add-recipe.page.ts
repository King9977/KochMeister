import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonButton, IonIcon,
  IonList, IonItem, IonLabel, IonInput, IonTextarea,
  IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  cameraOutline, addOutline, trashOutline,
  chevronBackOutline, saveOutline 
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Recipe, Ingredient } from '../../interfaces/recipe.interface';
import { SupabaseService } from '../../services/supabase.service';
import { RouterModule } from '@angular/router';

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
    RouterModule,
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
    IonTextarea
  ]
})
export class AddRecipePage {
  recipe: Recipe = {
    title: '',
    description: '',
    ingredients: [],
    steps: [],
    cookingTime: 0
  };
  recipeImage: string | null = null;

  constructor(private supabaseService: SupabaseService) {
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
    try {
      if (this.recipeImage) {
        // Konvertiere das Base64-Bild in eine Datei
        const response = await fetch(this.recipeImage);
        const blob = await response.blob();
        const file = new File([blob], 'recipe.jpg', { type: 'image/jpeg' });
        
        // Lade das Bild hoch
        const imageUrl = await this.supabaseService.uploadImage(file);
        this.recipe.image = imageUrl || undefined;
      }

      // Speichere das Rezept
      await this.supabaseService.addRecipe(this.recipe);
      window.location.href = '/home';
    } catch (error) {
      console.error('Fehler beim Speichern des Rezepts:', error);
    }
  }
}