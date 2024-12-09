import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonToggle,
  IonIcon, IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  moonOutline, notificationsOutline, 
  languageOutline, informationCircleOutline 
} from 'ionicons/icons';
import { StorageService } from '../../services/storage.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-settings',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Einstellungen</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <ion-item>
          <ion-icon name="moon-outline" slot="start"></ion-icon>
          <ion-label>Dark Mode</ion-label>
          <ion-toggle
            [(ngModel)]="darkMode"
            (ionChange)="toggleDarkMode($event)">
          </ion-toggle>
        </ion-item>

        <ion-item>
          <ion-icon name="notifications-outline" slot="start"></ion-icon>
          <ion-label>
            <h2>Benachrichtigungen</h2>
            <p>Timer und App-Updates</p>
          </ion-label>
          <ion-toggle [(ngModel)]="notifications"></ion-toggle>
        </ion-item>

        <ion-item button (click)="selectLanguage()">
          <ion-icon name="language-outline" slot="start"></ion-icon>
          <ion-label>
            <h2>Sprache</h2>
            <p>{{ currentLanguage }}</p>
          </ion-label>
        </ion-item>

        <ion-item button (click)="showAbout()">
          <ion-icon name="information-circle-outline" slot="start"></ion-icon>
          <ion-label>
            <h2>Über die App</h2>
            <p>Version 1.0.0</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <div class="offline-storage-info">
        <h3>Offline-Speicher</h3>
        <p>Gespeicherte Rezepte: {{ savedRecipesCount }}</p>
        <ion-button expand="block" fill="outline" (click)="clearOfflineData()">
          Cache leeren
        </ion-button>
      </div>
    </ion-content>
  `,
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonToggle,
    IonIcon,
    IonButton
  ]
})
export class SettingsPage implements OnInit {
  darkMode = false;
  notifications = true;
  currentLanguage = 'Deutsch';
  savedRecipesCount = 0;

  constructor(private storageService: StorageService) {
    addIcons({
      moonOutline,
      notificationsOutline,
      languageOutline,
      informationCircleOutline
    });
  }

  async ngOnInit() {
    this.darkMode = await this.storageService.getDarkMode();
    const recipes = await this.storageService.getOfflineRecipes();
    this.savedRecipesCount = recipes.length;
  }

  async toggleDarkMode(event: any) {
    const isDark = event.detail.checked;
    document.body.classList.toggle('dark', isDark);
    await this.storageService.setDarkMode(isDark);
  }

  selectLanguage() {
    // Implementierung der Sprachauswahl
    console.log('Sprachauswahl öffnen');
  }

  showAbout() {
    // Zeige Info-Dialog
    console.log('Über die App anzeigen');
  }

  async clearOfflineData() {
    await this.storageService.saveOfflineRecipes([]);
    this.savedRecipesCount = 0;
  }
}