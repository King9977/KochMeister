import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonCheckbox,
  IonButton, IonIcon, IonItemSliding, IonItemOption,
  IonItemOptions, IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  addOutline, trashOutline, checkmarkOutline, 
  closeOutline 
} from 'ionicons/icons';
import { ShoppingListItem } from '../../interfaces/recipe.interface';
import { StorageService } from '../../services/storage.service';
import { IonButtons } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-shopping-list',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Einkaufsliste</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="clearList()">
            <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <ion-item-sliding *ngFor="let item of shoppingList">
          <ion-item>
            <ion-checkbox 
              [(ngModel)]="item.checked"
              (ionChange)="updateItem(item)">
            </ion-checkbox>
            <ion-label [class.checked]="item.checked">
              {{ item.amount }} {{ item.unit }} {{ item.name }}
            </ion-label>
          </ion-item>

          <ion-item-options>
            <ion-item-option color="danger" (click)="removeItem(item)">
              <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>

      <div *ngIf="shoppingList.length === 0" class="empty-state">
        <p>Keine Artikel in der Einkaufsliste</p>
      </div>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button (click)="addNewItem()">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styleUrls: ['./shopping-list.page.scss'],
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
    IonCheckbox,
    IonButton,
    IonIcon,
    IonItemSliding,
    IonItemOption,
    IonItemOptions,
    IonFab,
    IonFabButton,
    IonButtons
  ]
})
export class ShoppingListPage implements OnInit {
  shoppingList: ShoppingListItem[] = [];

  constructor(private storageService: StorageService) {
    addIcons({
      addOutline,
      trashOutline,
      checkmarkOutline,
      closeOutline
    });
  }

  async ngOnInit() {
    await this.loadShoppingList();
  }

  async loadShoppingList() {
    this.shoppingList = await this.storageService.getShoppingList();
  }

  async updateItem(item: ShoppingListItem) {
    await this.storageService.saveShoppingList(this.shoppingList);
  }

  async removeItem(item: ShoppingListItem) {
    this.shoppingList = this.shoppingList.filter(i => i !== item);
    await this.storageService.saveShoppingList(this.shoppingList);
  }

  async clearList() {
    this.shoppingList = [];
    await this.storageService.saveShoppingList(this.shoppingList);
  }

  async addNewItem() {
    const newItem: ShoppingListItem = {
      name: '',
      amount: '',
      unit: '',
      checked: false
    };
    this.shoppingList.unshift(newItem);
    await this.storageService.saveShoppingList(this.shoppingList);
  }
}