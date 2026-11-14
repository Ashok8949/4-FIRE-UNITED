(function(){
'use strict';
if(document.body.classList.contains('admin-shell-ready'))return;

const pages=[
 ['CORE','dashboard.html','Dashboard','fa-gauge-high'],
 ['CORE','experience-studio.html','Experience Studio','fa-wand-magic-sparkles'],
 ['CORE','settings.html','Website Settings','fa-gear'],
 ['MANAGEMENT','players.html','Players','fa-users'],
 ['MANAGEMENT','tournaments.html','Tournaments','fa-trophy'],
 ['MANAGEMENT','gallery.html','Gallery','fa-images'],
 ['MANAGEMENT','clips.html','Clips','fa-film'],
 ['MANAGEMENT','announcements.html','Announcements','fa-bullhorn'],
 ['MANAGEMENT','messages.html','Messages','fa-envelope'],
 ['MANAGEMENT','applications.html','Applications','fa-file-circle-check'],
 ['MANAGEMENT','challenge-registrations.html','Challenge Registrations','fa-bolt'],
 ['MANAGEMENT','notifications.html','Notifications','fa-bell'],
 ['TOOLS','importPlayers.html','Import Players','fa-file-import']
];

const parentMap={
 'add-player.html':'players.html','edit-player.html':'players.html','importPlayers.html':'players.html',
 'add-tournament.html':'tournaments.html','edit-tournament.html':'tournaments.html',
 'add-gallery.html':'gallery.html','edit-gallery.html':'gallery.html',
 'add-clip.html':'clips.html','edit-clip.html':'clips.html',
 'add-announcement.html':'announcements.html',
 'view-message.html':'messages.html','view-application.html':'applications.html'
};
const subpages=new Set(Object.keys(parentMap));
const file=(location.pathname.split('/').pop()||'dashboard.html').toLowerCase();
const parentFile=parentMap[file];
const embedded=new URLSearchParams(location.search).get('embed')==='1';
const active=parentFile||file;

const old=document.querySelector('body > .sidebar, body > .admin-layout > .sidebar, body > aside.sidebar');
const sidebar=document.createElement('aside');sidebar.className='admin-shell-sidebar';
const brand=document.createElement('div');brand.className='admin-shell-brand';
const logo=document.createElement('img');logo.src='../images/logo/logo.png';logo.alt='4FU';
const name=document.createElement('span');name.textContent='4 FIRE UNITED';
brand.append(logo,name);sidebar.append(brand);
let group='';
const nav=document.createElement('nav');nav.className='admin-shell-nav';
for(const [section,href,label,icon] of pages){
 if(section!==group){const title=document.createElement('div');title.className='admin-shell-group';title.textContent=section;sidebar.append(title);group=section;}
 const a=document.createElement('a');a.className='admin-shell-link'+(href===active?' active':'');a.href=href;
 const i=document.createElement('i');i.className='fa-solid '+icon;
 const span=document.createElement('span');span.textContent=label;a.append(i,span);nav.append(a);
}
sidebar.append(nav);
if(old){old.replaceWith(sidebar);}else{document.body.insertBefore(sidebar,document.body.firstChild);}
document.body.classList.add('admin-shell-page','admin-shell-ready');
if(embedded)document.body.classList.add('admin-shell-embedded');

// Sub-pages are rendered inside their parent manager using a same-origin modal iframe.
// Their original standalone URLs remain functional for bookmarks and direct access.
if(!embedded&&!parentFile){
 const style=document.createElement('style');
 style.textContent=`
 .admin-subpage-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(3,6,12,.82);backdrop-filter:blur(9px)}
 .admin-subpage-dialog{display:flex;flex-direction:column;width:min(1500px,98vw);height:min(940px,96vh);overflow:hidden;background:#0c111a;border:1px solid rgba(255,129,40,.45);border-radius:18px;box-shadow:0 28px 100px rgba(0,0,0,.6)}
 .admin-subpage-bar{height:54px;flex:0 0 54px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;background:#151b27;border-bottom:1px solid #30394a;color:#fff;font:700 14px 'DM Sans',sans-serif}
 .admin-subpage-bar span{display:flex;align-items:center;gap:9px}
 .admin-subpage-bar span i{color:#ff8128}
 .admin-subpage-close{width:34px;height:34px;border:1px solid #3b4659;border-radius:9px;background:#202938;color:#fff;font-size:22px;cursor:pointer}
 .admin-subpage-frame{display:block;width:100%;height:100%;flex:1;border:0;background:#080a10}
 @media(max-width:680px){.admin-subpage-overlay{padding:0}.admin-subpage-dialog{width:100vw;height:100dvh;max-height:100dvh;border-radius:0;border:0}.admin-subpage-bar{height:48px;flex-basis:48px}}
 body.admin-subpage-open{overflow:hidden!important}
 body.admin-shell-embedded{display:block!important;min-height:100vh!important}
 body.admin-shell-embedded>.admin-shell-sidebar{display:none!important}
 body.admin-shell-embedded>.main,body.admin-shell-embedded .admin-shell-main{width:100%!important;max-width:none!important;margin:0!important;padding:22px clamp(14px,3vw,38px) 40px!important}
 body.admin-shell-embedded .admin-layout{display:block!important}
 `;
 document.head.appendChild(style);

 const titleMap={
 'add-player.html':'Add Player','edit-player.html':'Edit Player',
 'add-tournament.html':'Add Tournament','edit-tournament.html':'Edit Tournament',
 'add-gallery.html':'Add Gallery Image','edit-gallery.html':'Edit Gallery Image',
 'add-clip.html':'Add Clip','edit-clip.html':'Edit Clip',
 'add-announcement.html':'Add Announcement','view-message.html':'View Message',
 'view-application.html':'View Application','importPlayers.html':'Import Players'
 };
 let overlay=null,frame=null;
 function close(reload){
  if(!overlay)return;
  overlay.remove();overlay=null;frame=null;document.body.classList.remove('admin-subpage-open');
  if(reload)location.reload();
 }
 function openSubpage(url){
  const target=new URL(url,location.href),targetFile=target.pathname.split('/').pop().toLowerCase();
  if(!subpages.has(targetFile))return;
  target.searchParams.set('embed','1');
  overlay=document.createElement('div');overlay.className='admin-subpage-overlay';
  const dialog=document.createElement('section');dialog.className='admin-subpage-dialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');
  const bar=document.createElement('div');bar.className='admin-subpage-bar';
  const label=document.createElement('span');const icon=document.createElement('i');icon.className='fa-solid fa-layer-group';label.append(icon,document.createTextNode(titleMap[targetFile]||'Manage'));
  const closeBtn=document.createElement('button');closeBtn.type='button';closeBtn.className='admin-subpage-close';closeBtn.setAttribute('aria-label','Close');closeBtn.innerHTML='&times;';
  closeBtn.addEventListener('click',()=>close(false));bar.append(label,closeBtn);
  frame=document.createElement('iframe');frame.className='admin-subpage-frame';frame.title=titleMap[targetFile]||'Admin subpage';frame.src=target.href;
  frame.addEventListener('load',()=>{
   try{
    const loadedFile=frame.contentWindow.location.pathname.split('/').pop().toLowerCase();
    if(loadedFile===parentMap[targetFile])close(true);
   }catch(_){}
  });
  dialog.append(bar,frame);overlay.append(dialog);
  overlay.addEventListener('click',e=>{if(e.target===overlay)close(false);});
  document.body.append(overlay);document.body.classList.add('admin-subpage-open');
  closeBtn.focus();
 }
 document.addEventListener('click',e=>{
  const a=e.target.closest('a[href]');
  if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target&&a.target!=='_self')return;
  const raw=a.getAttribute('href');if(!raw||raw.startsWith('#')||/^(mailto:|tel:|https?:\/\/)/i.test(raw))return;
  const target=new URL(raw,location.href);
  if(target.origin!==location.origin||!subpages.has(target.pathname.split('/').pop().toLowerCase()))return;
  e.preventDefault();openSubpage(target.href);
 },true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay)close(false);});
}

// P13: instrument admin Firestore writes after all page scripts are loaded.
const auditScript=document.createElement('script');auditScript.src='js/admin-audit.js?v=p13';auditScript.defer=true;document.body.appendChild(auditScript);
})();