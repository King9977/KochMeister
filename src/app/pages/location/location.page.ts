/// <reference types="@types/google.maps" />

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonButton, 
  IonIcon, 
  IonButtons,
  IonBackButton  
} from '@ionic/angular/standalone';
import { Geolocation } from '@capacitor/geolocation';
import { addIcons } from 'ionicons';
import { locationOutline } from 'ionicons/icons';

@Component({
  selector: 'app-location',
  templateUrl: './location.page.html',
  styleUrls: ['./location.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonButtons,
    IonBackButton 
  ]
})
export class LocationPage implements OnInit {
  map: google.maps.Map | null = null;
  currentMarker: google.maps.Marker | null = null;

  constructor() {
    addIcons({
      locationOutline
    });
  }

  async ngOnInit() {
    await this.loadMap();
  }

  async loadMap() {
    // Standardposition (Deutschland)
    const position: google.maps.LatLngLiteral = { 
      lat: 51.1657, 
      lng: 10.4515 
    };
    
    const mapOptions: google.maps.MapOptions = {
      center: position,
      zoom: 6,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    const mapElement = document.getElementById('map');
    if (mapElement) {
      this.map = new google.maps.Map(mapElement, mapOptions);
    }
  }

  async getCurrentLocation() {
    try {
      // Standortberechtigungen prüfen und ggf. anfordern
      const permissions = await Geolocation.checkPermissions();
  
      if (permissions.location === 'denied') {
        const request = await Geolocation.requestPermissions();
        if (request.location === 'denied') {
          alert('Standortzugriff verweigert. Bitte Standortberechtigungen aktivieren.');
          return;
        }
      }
  
      // Aktuellen Standort mit hoher Genauigkeit abrufen
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true, // Aktiviert hohe Genauigkeit
        timeout: 10000 // Timeout nach 10 Sekunden
      });
  
      // Latitude und Longitude aus den Standortdaten abrufen
      const latLng: google.maps.LatLngLiteral = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
  
      if (this.map) {
        // Karte auf den Standort setzen
        this.map.setCenter(latLng); // Präzises Zentrieren
        this.map.setZoom(18); // Nahansicht auf 18 Zoomstufen
  
        // Vorherigen Marker entfernen, falls vorhanden
        if (this.currentMarker) {
          this.currentMarker.setMap(null);
        }
  
        // Marker auf dem genauen Standort platzieren
        this.currentMarker = new google.maps.Marker({
          position: latLng,
          map: this.map,
          title: 'Mein genauer Standort'
        });
  
        // Optionale InfoWindow hinzufügen (zeigt Koordinaten an)
        const infoWindow = new google.maps.InfoWindow({
          content: `Genauer Standort: <br>Latitude: ${latLng.lat.toFixed(6)}, <br>Longitude: ${latLng.lng.toFixed(6)}`
        });
        this.currentMarker.addListener('click', () => {
          infoWindow.open(this.map, this.currentMarker);
        });
  
        // Alternativ: Optionale nahegelegene Orte suchen
        this.searchNearbyPlaces(latLng);
      }
    } catch (error) {
      console.error('Fehler bei der Standortbestimmung:', error);
      alert('Konnte den Standort nicht ermitteln. Bitte überprüfen Sie die Berechtigungen und die GPS-Funktionalität.');
    }
  }
  
  private searchNearbyPlaces(latLng: google.maps.LatLngLiteral) {
    const service = new google.maps.places.PlacesService(this.map!);
    const request: google.maps.places.PlaceSearchRequest = {
      location: latLng,
      radius: 1000, // Reduzierter Radius für genauere Orte
      type: 'supermarket'
    };
  
    service.nearbySearch(
      request,
      (
        results: google.maps.places.PlaceResult[] | null,
        status: google.maps.places.PlacesServiceStatus
      ) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          results.forEach((place: google.maps.places.PlaceResult) => {
            if (place.geometry && place.geometry.location) {
              new google.maps.Marker({
                position: place.geometry.location,
                map: this.map!,
                title: place.name || 'Supermarkt',
                icon: {
                  url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                }
              });
            }
          });
        }
      }
    );
  }
  
}