import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonToggle,
  IonIcon, IonButton, AlertController, IonButtons, IonBackButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  moonOutline, notificationsOutline, 
  languageOutline, informationCircleOutline,
  chevronBackOutline 
} from 'ionicons/icons';
import { StorageService } from '../../services/storage.service';
import { NotificationService } from '../../services/notification.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-settings',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home"></ion-back-button>
        </ion-buttons>
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
          <ion-toggle 
            [(ngModel)]="notifications"
            (ionChange)="toggleNotifications($event)">
          </ion-toggle>
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
    IonButton,
    IonButtons,
    IonBackButton
  ]
})
export class SettingsPage implements OnInit {
  darkMode = false;
  notifications = false;
  currentLanguage = 'Deutsch';
  savedRecipesCount = 0;

  constructor(
    private storageService: StorageService,
    private notificationService: NotificationService,
    private alertController: AlertController,
    private platform: Platform
  ) {
    addIcons({
      moonOutline,
      notificationsOutline,
      languageOutline,
      informationCircleOutline,
      chevronBackOutline
    });
  }

  async ngOnInit() {
    this.darkMode = localStorage.getItem("darkmode") === "true";
    document.documentElement.classList.toggle('ion-palette-dark', this.darkMode);
    const recipes = await this.storageService.getOfflineRecipes();
    this.savedRecipesCount = recipes.length;
    
    // Prüfe den tatsächlichen System-Status beim Laden
    await this.checkNotificationStatus();
  }

  // Neue Methode zum Prüfen des Benachrichtigungsstatus
  private async checkNotificationStatus() {
    if (Capacitor.isNativePlatform()) {
      const status = await LocalNotifications.checkPermissions();
      this.notifications = status.display === 'granted';
    } else {
      this.notifications = false;
    }
  }

  async toggleNotifications(event: any) {
    if (event.detail.checked) {
      try {
        const status = await LocalNotifications.requestPermissions();
        this.notifications = status.display === 'granted';
      } catch (error) {
        console.error('Error toggling notifications:', error);
        this.notifications = false;
      }
    } else {
      // Sofort zurück auf true setzen
      event.target.checked = true;
      this.notifications = true;
      
      const alert = await this.alertController.create({
        header: 'Benachrichtigungen',
        message: 'Benachrichtigungen können nur in den System-Einstellungen deaktiviert werden.',
        buttons: [
          {
            text: 'Zu den Einstellungen',
            handler: () => {
              if (this.platform.is('android')) {
                window.open('package:' + environment.applicationId);
              }
            }
          },
          {
            text: 'OK'
          }
        ]
      });
      await alert.present();
    }
  }

  async toggleDarkMode(event: any) {
    const isDark = event.detail.checked;
    document.documentElement.classList.toggle('ion-palette-dark', isDark);
    localStorage.setItem("darkmode", isDark);
  }
  
  selectLanguage() {
    console.log('Sprachauswahl öffnen');
  }

  showAbout() {
    console.log('Über die App anzeigen');
  }

  async clearOfflineData() {
    await this.storageService.saveOfflineRecipes([]);
    await this.storageService.clearShoppingList();
    this.savedRecipesCount = 0;
  }
}