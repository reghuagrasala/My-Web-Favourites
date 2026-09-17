// ULAA-LIKE LOGIC: NEVER TRIGGER UNIVERSAL LINKS
let bvHistory=[]; let bvCurrentUrl=null;

function toUlaaUrl(url){
  // Convert URLs that block iframe to embed-friendly versions - like Ulaa does internally
  try{
    const u=new URL(url);
    // YouTube: watch?v= -> embed/
    if(u.hostname.includes('youtube.com') && u.searchParams.get('v')){
      return `https://www.youtube-nocookie.com/embed/${u.searchParams.get('v')}?autoplay=1&playsinline=1`;
    }
    if(u.hostname.includes('youtu.be')){
      const id=u.pathname.slice(1);
      return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1`;
    }
    // Instagram: keep as is but add embed param? Instagram blocks iframe, we will handle via fallback
    // Google search: add iFrame-friendly param
    if(u.hostname.includes('google.com') && u.pathname.includes('/search')){
      u.searchParams.set('igu','1'); // iframe-friendly google
      return u.toString();
    }
    return url;
  }catch{ return url; }
}

function openInAppFullscreen(url,title){
  bvCurrentUrl=url;
  const finalUrl=toUlaaUrl(url);
  document.getElementById('bvTitle').textContent=title||url;
  document.getElementById('browserView').classList.add('open');
  const frame=document.getElementById('bvFrame');
  frame.src=finalUrl;
  bvHistory.push({url:finalUrl, orig:url, title:title});
  // Ulaa-like: intercept any attempt to open native app - stay inside
}

function closeBrowserView(){
  document.getElementById('browserView').classList.remove('open');
  document.getElementById('bvFrame').src='about:blank';
  bvHistory=[];
}
function openCurrentInNewTabUlaaSafe(){
  // This STILL stays in default browser, not native app, like Ulaa's "Open in browser"
  // Ulaa uses its own engine, we use about:blank trick to avoid app jump
  if(!bvCurrentUrl) return;
  const url=bvCurrentUrl;
  // Do NOT use direct window.open(url) - that triggers YouTube app in Safari
  // Use blank + replace - like Ulaa does internally
  const win=window.open('about:blank','_blank','noopener,noreferrer');
  if(win){
    win.opener=null;
    win.document.open();
    win.document.write(`<!DOCTYPE html><meta name="viewport" content="width=device-width"><title>Opening</title><style>body{font-family:-apple-system;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#111;color:#888}</style>Opening in browser...<script>location.replace(${JSON.stringify(url)})<\/script>`);
    win.document.close();
  } else {
    // Fallback: still try but with noreferrer to reduce app handoff
    window.open(url,'_blank','noopener,noreferrer');
  }
}

document.getElementById('bvClose').onclick=closeBrowserView;
document.getElementById('bvCloseLeft').onclick=closeBrowserView;
document.getElementById('bvBack').onclick=()=>{
  if(bvHistory.length>1){
    bvHistory.pop();
    const prev=bvHistory[bvHistory.length-1];
    document.getElementById('bvTitle').textContent=prev.title||prev.orig;
    document.getElementById('bvFrame').src=prev.url;
    bvCurrentUrl=prev.orig;
  } else {
    closeBrowserView();
  }
};
document.getElementById('bvOpenNew').onclick=openCurrentInNewTabUlaaSafe;

// Favicon
function faviconUrl(url){ try{ const u=new URL(url); return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`; }catch{ return ''; } }
function faviconFallback(url){ try{ const u=new URL(url); return `https://icons.duckduckgo.com/ip3/${u.hostname}.ico`; }catch{ return ''; } }

const defaultFolders={
"Web tools & services": [{title:"My Safari Favourites",url:"https://reghuagrasala.github.io/My-Web-Favourites/"},{title:"WEB TOOLS APP",url:"https://round-pine-6afb.hrcvb7p7r5.workers.dev/"}],
"ഇന്നത്തെ വിശേഷം": [{title:"തൃശ്ശൂരിലെ ആഘോഷങ്ങൾ",url:"https://www.google.com/search?q=%E0%B4%A4%E0%B5%83%E0%B4%B6%E0%B5%8D%E0%B4%B6%E0%B5%82%E0%B4%B0%E0%B4%BF%E0%B4%B2%E0%B5%86+%E0%B4%86%E0%B4%98%E0%B5%8B%E0%B4%B7%E0%B4%99%E0%B5%8D%E0%B4%99%E0%B5%BE"},{title:"തൃശൂരിൽ ഇന്ന്",url:"https://www.google.com/search?q=%E0%B4%A4%E0%B5%83%E0%B4%B6%E0%B5%82%E0%B4%B0%E0%B4%BF%E0%B4%B2%E0%B5%8D+%E0%B4%87%E0%B4%A8%E0%B5%8D%E0%B4%A8%E0%B5%8D"},{title:"ഇന്നത്തെ മലയാള കലണ്ടർ",url:"https://www.google.com/search?q=%E0%B4%87%E0%B4%A8%E0%B5%8D%E0%B4%A8%E0%B4%A4%E0%B5%8D%E0%B4%A4%E0%B5%86+%E0%B4%AE%E0%B4%B2%E0%B4%AF%E0%B4%BE%E0%B4%B3+%E0%B4%95%E0%B4%B2%E0%B4%A3%E0%B5%8D%E0%B4%9F%E0%B5%BC"}],
"മലയാളം വാർത്ത": [{title:"Google വാർത്ത",url:"https://news.google.com/home?hl=ml&gl=IN&ceid=IN:ml"}],
"English News": [{title:"Google News",url:"https://news.google.com/topstories"}],
"Radio, TV, OTT, Audiobooks": [{title:"YouTube",url:"https://youtube.com"}],
"Social Media": [{title:"Instagram",url:"https://instagram.com"}],
"AI Tools": [{title:"ChatGPT",url:"https://chatgpt.com"}],
"Online Markets": [{title:"Amazon",url:"https://amazon.in"}]
};

let isEditMode=false; let data={}; let editingFolder=null;
function loadData(){ const s=localStorage.getItem('favDeploy_v3'); if(s){try{data=JSON.parse(s);}catch{data=defaultFolders}}else data=defaultFolders; }
function saveData(){ localStorage.setItem('favDeploy_v3', JSON.stringify(data)); }
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)}
function render(){
 const grid=document.getElementById('grid'); grid.innerHTML='';
 Object.keys(data).forEach(name=>{
  const links=data[name]||[];
  const div=document.createElement('div'); div.className='folder'+(isEditMode?' editing':'');
  const box=document.createElement('div'); box.className='box';
  for(let i=0;i<4;i++){ const l=links[i]; const mini=document.createElement('div'); mini.className='mini'; if(l){ const img=document.createElement('img'); img.src=faviconUrl(l.url); img.onerror=()=>{ img.src=faviconFallback(l.url); }; mini.appendChild(img); }else{ mini.textContent='•'; mini.style.color='#777'; } box.appendChild(mini); }
  const label=document.createElement('div'); label.className='label'; label.textContent=name;
  const badge=document.createElement('div'); badge.className='edit-badge'; badge.textContent='✎';
  const wrap=document.createElement('div'); wrap.style.cssText='position:relative;width:100%;height:78%'; wrap.appendChild(box); wrap.appendChild(badge);
  div.appendChild(wrap); div.appendChild(label);
  div.onclick=()=>{ if(isEditMode) openEdit(name); else openView(name); };
  grid.appendChild(div);
 });
}
function openView(name){
 document.getElementById('viewTitle').textContent=name;
 const list=document.getElementById('viewList'); list.innerHTML='';
 (data[name]||[]).forEach(l=>{
  const row=document.createElement('div'); row.className='link-card';
  const img=document.createElement('img'); img.src=faviconUrl(l.url); img.onerror=()=>{img.src=faviconFallback(l.url)};
  const span=document.createElement('div'); span.className='t'; span.textContent=l.title||l.url;
  row.appendChild(img); row.appendChild(span);
  row.onclick=()=>openInAppFullscreen(l.url, l.title);
  list.appendChild(row);
 });
 document.getElementById('viewModal').classList.add('open');
}
function openEdit(name){
 editingFolder=name;
 document.getElementById('editFolderName').value=name;
 const container=document.getElementById('editList'); container.innerHTML='';
 (data[name]||[]).forEach(l=>{
  const r=document.createElement('div'); r.className='row';
  r.innerHTML=`<img src="${faviconUrl(l.url)}" style="width:16px;height:16px;border-radius:3px"><div style="flex:1;display:flex;flex-direction:column;gap:2px"><input class="etitle" value="${l.title.replace(/"/g,'&quot;')}" placeholder="Title"><input class="eurl" value="${l.url.replace(/"/g,'&quot;')}" placeholder="https://"></div><button class="btn-del" style="border:none;background:#eee;border-radius:8px;padding:6px 8px;cursor:pointer">✕</button>`;
  r.querySelector('.btn-del').onclick=()=>r.remove();
  container.appendChild(r);
 });
 document.getElementById('editModal').classList.add('open');
}
document.getElementById('addLinkBtn').onclick=()=>{
 const c=document.getElementById('editList');
 const r=document.createElement('div'); r.className='row';
 r.innerHTML=`<div style="width:16px"></div><div style="flex:1;display:flex;flex-direction:column;gap:2px"><input class="etitle" placeholder="Title"><input class="eurl" placeholder="https://"></div><button style="border:none;background:#eee;border-radius:8px;padding:6px 8px;cursor:pointer" onclick="this.parentElement.remove()">✕</button>`;
 c.appendChild(r);
};
document.getElementById('saveEditBtn').onclick=()=>{
 const newName=document.getElementById('editFolderName').value.trim()||editingFolder;
 const rows=[...document.getElementById('editList').querySelectorAll('.row')];
 const newLinks=[]; rows.forEach(r=>{ const t=r.querySelector('.etitle').value.trim(); const u=r.querySelector('.eurl').value.trim(); if(t||u) newLinks.push({title:t||u,url:u}); });
 if(newName!==editingFolder) delete data[editingFolder];
 data[newName]=newLinks; saveData(); render();
 document.getElementById('editModal').classList.remove('open'); toast(`Saved ${newName}`);
};
document.getElementById('viewClose').onclick=()=>document.getElementById('viewModal').classList.remove('open');
document.getElementById('editClose').onclick=()=>document.getElementById('editModal').classList.remove('open');
document.getElementById('cancelEditBtn').onclick=()=>document.getElementById('editModal').classList.remove('open');
document.getElementById('viewModal').onclick=e=>{if(e.target.id==='viewModal') e.currentTarget.classList.remove('open')};
document.getElementById('editModal').onclick=e=>{if(e.target.id==='editModal') e.currentTarget.classList.remove('open')};

function parseBookmarks(text){
 const p=new DOMParser(); const doc=p.parseFromString(text,'text/html');
 const out={}; let cur='Imported'; out[cur]=[];
 doc.querySelectorAll('h3, a').forEach(n=>{
  if(n.tagName==='H3'){ cur=n.textContent.trim()||'Folder'; if(!out[cur]) out[cur]=[]; }
  else if(n.tagName==='A'){ const href=n.getAttribute('HREF'); const title=n.textContent.trim(); if(href){ if(!out[cur]) out[cur]=[]; out[cur].push({title:title||href,url:href}); } }
 });
 Object.keys(out).forEach(k=>{ if(out[k].length===0) delete out[k]; });
 return out;
}

const importCap=document.getElementById('importCap');
const editCap=document.getElementById('editCap');
const refreshCap=document.getElementById('refreshCap');
const shareCap=document.getElementById('shareCap');
const a2hsCap=document.getElementById('a2hsCap');
function flash(btn){ btn.classList.add('active'); setTimeout(()=>{ if(btn!==editCap || !isEditMode) btn.classList.remove('active'); },350); }
importCap.onclick=()=>{ flash(importCap); document.getElementById('fileInput').click(); };
editCap.onclick=()=>{ isEditMode=!isEditMode; editCap.classList.toggle('active',isEditMode); render(); toast(isEditMode?'Edit ON - tap folder to edit':'Edit OFF'); };
refreshCap.onclick=()=>{ flash(refreshCap); loadData(); render(); toast('Refreshed'); };
shareCap.onclick=async()=>{
 flash(shareCap);
 const shareData={title:'Favorites', text:'My private favorites - Ulaa Mode', url:location.href};
 try{
  if(navigator.share){ await navigator.share(shareData); toast('Shared!'); }
  else if(navigator.clipboard){ await navigator.clipboard.writeText(location.href); toast('Link copied!'); }
  else { window.prompt('Copy link:', location.href); }
 }catch(e){}
};
document.getElementById('shareFolderBtn').onclick=async()=>{
 const name=document.getElementById('viewTitle').textContent;
 const links=data[name]||[]; const text=links.map(l=>`${l.title}: ${l.url}`).join('\n');
 try{ if(navigator.share){ await navigator.share({title:name, text:text}); } else { await navigator.clipboard.writeText(text); toast('Copied!'); } }catch(e){}
};
document.getElementById('waShare').onclick=()=>{ window.open(`https://wa.me/?text=${encodeURIComponent(location.href)}`,'_blank','noopener'); };
document.getElementById('tgShare').onclick=()=>{ window.open(`https://t.me/share/url?url=${encodeURIComponent(location.href)}`,'_blank','noopener'); };
document.getElementById('fbShare').onclick=()=>{ window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}`,'_blank','noopener'); };

let deferredPrompt=null;
window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); deferredPrompt=e; a2hsCap.style.display='inline-flex'; });
a2hsCap.onclick=async()=>{
 flash(a2hsCap);
 if(deferredPrompt){ deferredPrompt.prompt(); const r=await deferredPrompt.userChoice; toast(r.outcome==='accepted'?'Added':'Dismissed'); deferredPrompt=null; }
 else { alert('iPhone: Share → Add to Home Screen\nAndroid: Menu → Add to Home Screen'); }
};
a2hsCap.style.display='none';

document.getElementById('fileInput').onchange=e=>{
 const file=e.target.files[0]; if(!file) return;
 const reader=new FileReader();
 reader.onload=ev=>{
  try{
   let parsed=ev.target.result.includes('<H3')||ev.target.result.includes('<A ') ? parseBookmarks(ev.target.result) : JSON.parse(ev.target.result);
   data=parsed; saveData(); render(); toast(`Imported ${Object.keys(parsed).length} folders`);
  }catch{ toast('Import failed'); }
 };
 reader.readAsText(file);
};
const drop=document.getElementById('drop');
['dragenter','dragover'].forEach(ev=>document.addEventListener(ev,e=>{e.preventDefault(); drop.style.display='flex';}));
['dragleave','drop'].forEach(ev=>document.addEventListener(ev,e=>{ if(ev==='drop'){ e.preventDefault(); const f=e.dataTransfer.files[0]; if(f){ const r=new FileReader(); r.onload=ev2=>{ const d=parseBookmarks(ev2.target.result); data=d; saveData(); render(); toast('Imported'); }; r.readAsText(f); } } drop.style.display='none'; }));

const manifest={name:'Favorites - Ulaa Mode',short_name:'Favorites',display:'standalone',background_color:'#0a0a0a',theme_color:'#0a0a0a',start_url:'./',icons:[{src:'https://www.google.com/s2/favicons?domain=favorites.app&sz=192',sizes:'192x192',type:'image/png'}]};
const blob=new Blob([JSON.stringify(manifest)],{type:'application/json'});
document.getElementById('manifestLink').href=URL.createObjectURL(blob);
if('serviceWorker' in navigator){
 const swCode=`self.addEventListener('install',e=>{e.waitUntil(caches.open('fav-v1').then(c=>c.addAll(['./']))}); self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))})`;
 const swBlob=new Blob([swCode],{type:'text/javascript'});
 navigator.serviceWorker.register(URL.createObjectURL(swBlob)).catch(()=>{});
}
loadData(); render();
document.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});