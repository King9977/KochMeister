import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { IonicStorageModule } from '@ionic/storage-angular';
import { Storage } from '@ionic/storage-angular';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { NotificationService } from './app/services/notification.service';

bootstrapApplication(AppComponent, {
  providers: [
    NotificationService,
    provideRouter(routes),
    provideIonicAngular(),
    Storage,
    {
      provide: Storage,
      useFactory: () => {
        const storage = new Storage();
        storage.create();
        return storage;
      }
    }
  ]
});