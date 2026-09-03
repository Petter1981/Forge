self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(clients.claim()));
self.addEventListener('push',event=>{
 let data={};
 try{data=event.data?event.data.json():{}}catch{data={body:event.data?event.data.text():'FORGE'}}
 event.waitUntil(self.registration.showNotification(data.title||'FORGE',{body:data.body||'',data:{url:data.url||self.location.origin},tag:data.eventType||'forge'}));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const url=event.notification.data?.url||'/';
 event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
  for(const c of list){if('focus' in c){c.navigate(url);return c.focus();}}
  return clients.openWindow?clients.openWindow(url):undefined;
 }));
});
