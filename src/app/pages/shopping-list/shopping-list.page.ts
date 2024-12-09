import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonCheckbox, IonButton,
  IonFab, IonFabButton, IonIcon, IonModal, IonInput,
  IonButtons, IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, trashOutline, closeOutline, pencilOutline } from 'ionicons/icons';
import { ShoppingListItem } from '../../interfaces/recipe.interface';
import { StorageService } from '../../services/storage.service';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-shopping-list',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Einkaufsliste</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="clearCheckedItems()">
            <ion-icon name="trash-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <ion-item *ngFor="let item of shoppingList">
          <ion-checkbox [(ngModel)]="item.checked" (ionChange)="saveList()"></ion-checkbox>
          <ion-label>{{ item.amount }} {{ item.unit }} {{ item.name }}</ion-label>
          <ion-button fill="clear" slot="end" (click)="editItem(item)">
            <ion-icon name="pencil-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-item>
      </ion-list>

      <div *ngIf="shoppingList.length === 0" class="empty-state">
        <p>Keine Artikel in der Einkaufsliste</p>
      </div>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button (click)="openAddModal()">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- Add/Edit Modal -->
      <ion-modal [isOpen]="showModal" [breakpoints]="[0, 0.5, 0.8]" [initialBreakpoint]="0.5">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>{{ isEditing ? 'Artikel bearbeiten' : 'Artikel hinzufügen' }}</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeModal()">
                  <ion-icon name="close-outline"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>

          <ion-content class="ion-padding">
            <ion-list>
              <ion-item>
                <ion-label position="stacked">Name</ion-label>
                <ion-input [(ngModel)]="currentItem.name" placeholder="Artikelname"></ion-input>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">Menge</ion-label>
                <ion-input [(ngModel)]="currentItem.amount" type="text" placeholder="Menge"></ion-input>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">Einheit</ion-label>
                <ion-input [(ngModel)]="currentItem.unit" placeholder="Einheit"></ion-input>
              </ion-item>
            </ion-list>

            <div class="button-container">
              <ion-button expand="block" (click)="saveItem()">
                {{ isEditing ? 'Aktualisieren' : 'Speichern' }}
              </ion-button>
              <ion-button expand="block" fill="clear" (click)="closeModal()">
                Abbrechen
              </ion-button>
            </div>
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styleUrls: ['./shopping-list.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonCheckbox,
    IonButton,
    IonFab,
    IonFabButton,
    IonIcon,
    IonModal,
    IonInput,
    IonButtons,
    IonLabel
  ]
})
export class ShoppingListPage implements OnInit {
  shoppingList: ShoppingListItem[] = [];
  showModal = false;
  isEditing = false;
  currentItem: ShoppingListItem = this.getEmptyItem();

  constructor(
    private storageService: StorageService,
    private supabaseService: SupabaseService
  ) {
    addIcons({ addOutline, trashOutline, closeOutline, pencilOutline });
  }

  private getEmptyItem(): ShoppingListItem {
    return {
      name: '',
      amount: '',
      unit: '',
      checked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async ngOnInit() {
    await this.loadShoppingList();
  }

  async loadShoppingList() {
    const offlineList = await this.storageService.getShoppingList() || [];
    this.shoppingList = offlineList;

    try {
      const onlineList = await this.supabaseService.fetchShoppingList();
      if (onlineList && onlineList.length > 0) {
        this.shoppingList = this.mergeLists(offlineList, onlineList);
        await this.storageService.saveShoppingList(this.shoppingList);
      }
    } catch (error) {
      console.error('Error fetching online list:', error);
    }
  }

  async saveItem() {
    if (this.currentItem.name.trim() === '') return; // Validierung: Name darf nicht leer sein.
  
    this.currentItem.updatedAt = new Date().toISOString();
  
    if (!this.isEditing) {
      // Neuer Artikel
      this.currentItem.createdAt = new Date().toISOString();
      try {
        const newItem = await this.supabaseService.addShoppingItem(this.currentItem);
        if (newItem) {
          this.shoppingList.unshift(newItem); // Füge neuen Artikel zur Liste hinzu.
        }
      } catch (error) {
        console.error('Fehler beim Hinzufügen des Artikels:', error);
      }
    } else {
      // Artikel bearbeiten
      const index = this.shoppingList.findIndex(item => item.id === this.currentItem.id);
      if (index > -1) {
        this.shoppingList[index] = { ...this.currentItem };
        try {
          await this.supabaseService.updateShoppingList(this.shoppingList);
        } catch (error) {
          console.error('Fehler beim Aktualisieren des Artikels:', error);
        }
      }
    }
  
    this.closeModal();
    await this.storageService.saveShoppingList(this.shoppingList); // Speichern Sie lokal für Offline-Support.
  }
  

  async saveList() {
    await this.storageService.saveShoppingList(this.shoppingList);

    try {
      await this.supabaseService.updateShoppingList(this.shoppingList);
    } catch (error) {
      console.error('Error saving to Supabase:', error);
    }
  }

  async clearCheckedItems() {
    const itemsToDelete = this.shoppingList.filter(item => item.checked);
    this.shoppingList = this.shoppingList.filter(item => !item.checked);

    await this.storageService.saveShoppingList(this.shoppingList);

    try {
      for (const item of itemsToDelete) {
        if (item.id) {
          await this.supabaseService.deleteShoppingItem(item.id);
        }
      }
    } catch (error) {
      console.error('Error deleting items from Supabase:', error);
    }
  }

  closeModal() {
    this.showModal = false;
    this.currentItem = this.getEmptyItem();
    this.isEditing = false;
  }

  editItem(item: ShoppingListItem) {
    this.isEditing = true;
    this.currentItem = { ...item };
    this.showModal = true;
  }

  openAddModal() {
    this.isEditing = false;
    this.currentItem = this.getEmptyItem();
    this.showModal = true;
  }

  private mergeLists(offlineList: ShoppingListItem[], onlineList: ShoppingListItem[]): ShoppingListItem[] {
    const merged = [...offlineList];

    onlineList.forEach(onlineItem => {
      const existingIndex = merged.findIndex(item => item.id === onlineItem.id);

      if (existingIndex === -1) {
        merged.push(onlineItem);
      } else {
        const onlineDate = new Date(onlineItem.updatedAt || '');
        const offlineDate = new Date(merged[existingIndex].updatedAt || '');

        if (onlineDate > offlineDate) {
          merged[existingIndex] = onlineItem;
        }
      }
    });

    return merged;
  }
}
