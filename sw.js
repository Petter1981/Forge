self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(clients.claim()));

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.mode!=='navigate') return;
  event.respondWith((async()=>{
    const res=await fetch(req);
    const type=res.headers.get('content-type')||'';
    if(!type.includes('text/html')) return res;
    const html=await res.text();
    if(html.includes('forge-runtime-fix.js')) return new Response(html,{status:res.status,statusText:res.statusText,headers:res.headers});
    const injected=html.replace('</body>','<script src="./forge-runtime-fix.js"></script></body>');
    return new Response(injected,{status:res.status,statusText:res.statusText,headers:res.headers});
  })().catch(()=>fetch(req)));
});

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
