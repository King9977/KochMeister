// notification-worker.js
self.addEventListener('install', function(event) {
    event.waitUntil(self.skipWaiting());
  });
  
  self.addEventListener('activate', function(event) {
    event.waitUntil(self.clients.claim());
  });
  
  self.addEventListener('message', function(event) {
    if (event.data.type === 'SCHEDULE_TIMER') {
      var duration = event.data.time - Date.now();
      var title = event.data.title;
      
      setTimeout(function() {
        self.registration.showNotification('Rezept Timer', {
          body: 'Der Timer für ' + title + ' ist abgelaufen!',
          icon: '/assets/icons/timer-icon.png',
          vibrate: [200, 100, 200],
          tag: 'recipe-timer',
          requireInteraction: true,
          data: {
            timestamp: Date.now()
          }
        });
      }, duration);
    }
  });
  
  self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(function(clientList) {
          if (clientList.length > 0) {
            clientList[0].focus();
          } else {
            clients.openWindow('/');
          }
        })
    );
  });