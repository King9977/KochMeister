import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { AlertController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private isAppActive = true;

  constructor(
    private platform: Platform,
    private alertController: AlertController
  ) {
    this.initialize();
  }

  private async initialize() {
    if (Capacitor.isNativePlatform()) {
      try {
        await this.platform.ready();
        this.setupAppStateListeners();
        this.setupNotificationListeners();
      } catch (error) {
        console.error('Fehler bei der Initialisierung:', error);
      }
    }
  }

  private setupAppStateListeners() {
    App.addListener('appStateChange', ({ isActive }) => {
      this.isAppActive = isActive;
      console.log('App state changed:', isActive ? 'active' : 'inactive');
    });
  }

  private setupNotificationListeners() {
    // Wenn Notification empfangen wird
    LocalNotifications.addListener('localNotificationReceived', notification => {
      console.log('Notification received:', notification);
      if (this.isAppActive) {
        this.showInAppAlert(notification.title || '', notification.body || '');
      }
    });

    // Wenn auf Notification geklickt wird
    LocalNotifications.addListener('localNotificationActionPerformed', notification => {
      console.log('Notification clicked:', notification);
      if (this.isAppActive) {
        this.showInAppAlert(
          notification.notification.title || '', 
          notification.notification.body || ''
        );
      }
    });
  }

  private async showInAppAlert(title: string, message: string) {
    const alert = await this.alertController.create({
      header: title,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  async scheduleNotification(title: string, durationInMinutes: number): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      const notificationId = new Date().getTime();
      const scheduleTime = new Date(Date.now() + (durationInMinutes * 60 * 1000));

      // Timer planen
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title: '🍳 Timer abgelaufen!',
            body: `${title} ist fertig!`,
            schedule: { at: scheduleTime },
            sound: 'default',
            smallIcon: 'ic_stat_timer',
            largeIcon: 'ic_launcher',
            autoCancel: true
          }
        ]
      });

      // Überprüfen ob Timer erfolgreich geplant wurde
      const pending = await LocalNotifications.getPending();
      const isScheduled = pending.notifications.some(n => n.id === notificationId);
      
      if (!isScheduled) {
        throw new Error('Notification wurde nicht erfolgreich geplant');
      }

      // Start-Bestätigung nur in der App anzeigen
      if (this.isAppActive) {
        await this.showInAppAlert(
          'Timer gestartet',
          `Timer wurde für ${durationInMinutes} Minuten gestellt.`
        );
      }

      return true;
    } catch (error) {
      console.error('Fehler beim Planen der Notification:', error);
      if (this.isAppActive) {
        await this.showInAppAlert(
          'Fehler',
          'Der Timer konnte nicht gestellt werden. Bitte versuchen Sie es erneut.'
        );
      }
      return false;
    }
  }

  async cancelNotifications() {
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.cancel({ notifications: [] });
      } catch (error) {
        console.error('Fehler beim Abbrechen der Notifications:', error);
      }
    }
  }

  // Hilfsmethode um den App-Status zu prüfen
  isApplicationActive(): boolean {
    return this.isAppActive;
  }
}