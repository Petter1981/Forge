self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(clients.claim()));
self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?event.data.json():{}}catch{data={body:event.data?event.data.text():'FORGE'}}
  event.waitUntil(self.registration.showNotification(data.title||'FORGE',{
    body:data.body||'',
    data:{url:data.url||self.location.origin}
  }));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url||'/'));
});
