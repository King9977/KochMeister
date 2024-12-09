import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private isSupported = 'Notification' in window;
  private worker: ServiceWorker | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      if (this.isSupported) {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);

        if (permission === 'granted' && 'serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register('/notification-worker.js');
          console.log('ServiceWorker registration successful:', registration);
          this.worker = registration.active;
        }
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  async scheduleNotification(title: string, durationInSeconds: number): Promise<boolean> {
    try {
      if (!this.isSupported || Notification.permission !== 'granted') {
        return false;
      }

      // Fallback für lokale Notification falls Service Worker nicht verfügbar
      if (!this.worker) {
        setTimeout(() => {
          new Notification('Rezept Timer', {
            body: `Der Timer für ${title} ist abgelaufen!`,
            icon: '/assets/icons/timer-icon.png',
            tag: 'recipe-timer',
            requireInteraction: true
          });
        }, durationInSeconds * 1000);
        return true;
      }

      // Service Worker Notification
      const registration = await navigator.serviceWorker.ready;
      await registration.active?.postMessage({
        type: 'SCHEDULE_TIMER',
        title: title,
        time: Date.now() + (durationInSeconds * 1000)
      });
      
      return true;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return false;
    }
  }
}