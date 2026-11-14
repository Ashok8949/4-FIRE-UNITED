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
['TOOLS','importPlayers.html','Import Players','fa-file-import'],
['TOOLS','add-player.html','Add Player','fa-user-plus'],
['TOOLS','edit-player.html','Edit Player','fa-user-pen'],
['TOOLS','add-tournament.html','Add Tournament','fa-circle-plus'],
['TOOLS','edit-tournament.html','Edit Tournament','fa-pen-to-square'],
['TOOLS','add-gallery.html','Add Gallery Image','fa-image'],
['TOOLS','edit-gallery.html','Edit Gallery Image','fa-pen'],
['TOOLS','add-clip.html','Add Clip','fa-circle-plus'],
['TOOLS','edit-clip.html','Edit Clip','fa-pen'],
['TOOLS','add-announcement.html','Add Announcement','fa-bullhorn'],
['TOOLS','view-message.html','View Message','fa-envelope-open'],
['TOOLS','view-application.html','View Application','fa-file-lines']
];
const file=(location.pathname.split('/').pop()||'dashboard.html').toLowerCase();
const parentMap={'edit-player.html':'players.html','add-player.html':'players.html','edit-tournament.html':'tournaments.html','add-tournament.html':'tournaments.html','edit-gallery.html':'gallery.html','add-gallery.html':'gallery.html','edit-clip.html':'clips.html','add-clip.html':'clips.html','add-announcement.html':'announcements.html','view-message.html':'messages.html','view-application.html':'applications.html'};
const active=parentMap[file]||file;
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
})();