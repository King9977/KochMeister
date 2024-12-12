import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
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
    try {
      await this.platform.ready();
    } catch (error) {
      console.error('Fehler bei der Initialisierung:', error);
    }
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
    try {
      setTimeout(async () => {
        if (this.isAppActive) {
          await this.showInAppAlert(
            '🍳 Timer abgelaufen',
            `${title} ist nach ${durationInMinutes} Minuten fertig!`
          );
        }
      }, durationInMinutes * 60 * 1000);

      return true;
    } catch (error) {
      console.error('Fehler beim Setzen des Timers:', error);
      await this.showInAppAlert(
        'Fehler',
        'Der Timer konnte nicht gestellt werden. Bitte versuchen Sie es erneut.'
      );
      return false;
    }
  }

  isApplicationActive(): boolean {
    return this.isAppActive;
  }
}