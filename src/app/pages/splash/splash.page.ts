import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { StorageService } from '../../services/storage.service';
import { Network } from '@capacitor/network';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent]
})
export class SplashPage implements OnInit {
  constructor(
    private router: Router,
    private storageService: StorageService
  ) {}

  async ngOnInit() {
    // Prüfe Netzwerkstatus
    const status = await Network.getStatus();

    // Lade Dark Mode Einstellung
    const darkMode = await this.storageService.getDarkMode();
    document.body.classList.toggle('dark', darkMode);

    // Nach 3 Sekunden zur Home-Page weiterleiten
    setTimeout(() => {
      this.router.navigate(['/home'], { 
        state: { isOnline: status.connected }
      });
    }, 3000);
  }
}
