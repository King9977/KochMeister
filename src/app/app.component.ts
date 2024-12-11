import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupabaseService } from './services/supabase.service';

@Component({
  selector: 'app-root',
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonApp,
    IonRouterOutlet
  ]
})
export class AppComponent implements OnInit {

  constructor(private supabaseService: SupabaseService) {
    this.initializeApp();
  }

  async initializeApp() {
    console.log('Testing Supabase connection...');
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('recipes')
        .select('count')
        .limit(1);
      
      console.log('Connection test result:', { data, error });
      
      if (error) {
        console.error('Connection failed:', error);
      } else {
        console.log('Connection successful!');
      }
    } catch (e) {
      console.error('Connection test error:', e);
    }
  }

  ngOnInit() {
    document.documentElement.classList.toggle('ion-palette-dark', localStorage.getItem("darkmode") === "true")
  }
}