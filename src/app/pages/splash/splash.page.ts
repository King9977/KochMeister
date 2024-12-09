import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { restaurantOutline } from 'ionicons/icons';
import { StorageService } from '../../services/storage.service';
import { Network } from '@capacitor/network';

@Component({
  selector: 'app-splash',
  template: `
    <ion-content class="ion-padding">
      <div class="splash-container">
        <div class="logo-container">
          <ion-icon name="restaurant-outline" size="large"></ion-icon>
          <h1>KochMeister</h1>
          <p>Dein digitales Kochbuch</p>
        </div>
      </div>
    </ion-content>
  `,
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon]
})
export class SplashPage implements OnInit {
  constructor(
    private router: Router,
    private storageService: StorageService
  ) {
    addIcons({ restaurantOutline });
  }

  async ngOnInit() {
    // Prüfe Netzwerkstatus
    const status = await Network.getStatus();
    
    // Lade Dark Mode Einstellung
    const darkMode = await this.storageService.getDarkMode();
    document.body.classList.toggle('dark', darkMode);

    // Nach 3 Sekunden zur Home-Page
    setTimeout(() => {
      this.router.navigate(['/home'], { 
        state: { isOnline: status.connected }
      });
    }, 3000);
  }
}