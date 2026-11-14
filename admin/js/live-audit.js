(function(){
'use strict';
const ADMIN='aks303603@gmail.com',dbRef=()=>window.db&&db.collection('adminAuditLogs');
const $=id=>document.getElementById(id);
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function dateOf(x){if(!x)return null;if(x.toDate)return x.toDate();const d=new Date(x);return Number.isNaN(d.getTime())?null:d}
function pretty(x){const d=dateOf(x);return d?d.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}):'Date unavailable'}
function dayKey(x){const d=dateOf(x);return d?d.toLocaleDateString(undefined,{weekday:'long',day:'2-digit',month:'long',year:'numeric'}):'Undated'}
function val(d){return d&&(d.name||d.title||d.username||d.ign||d.subject||d.brandName)||'Website record'}
function changes(before,after){if(!before&&!after)return'No field snapshot';const a=before||{},b=after||{},keys=[...new Set([...Object.keys(a),...Object.keys(b)])].filter(k=>!['updatedAt','createdAt','updatedBy','createdBy'].includes(k));const changed=keys.filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k])).slice(0,5);return changed.length?changed.map(k=>k+': '+JSON.stringify(a[k]??'—').slice(0,55)+' → '+JSON.stringify(b[k]??'—').slice(0,55)).join(' · '):'Record saved'}
function groupRows(rows){const groups=new Map();rows.forEach(r=>{const key=dayKey(r.createdAt||r.clientAt);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r)});return [...groups.entries()]}
let allRows=[];
function render(){
 const root=$('liveAuditList');if(!root)return;
 const q=($('auditSearch')?.value||'').toLowerCase(),kind=$('auditFilter')?.value||'all';
 const rows=allRows.filter(r=>(kind==='all'||r.collection===kind)&&(!q||[r.title,r.collection,r.operation,r.actor,r.documentPath].join(' ').toLowerCase().includes(q)));
 if(!rows.length){root.innerHTML='<div class="audit-empty">No matching activity. Legacy entries are reconstructed only where existing records contain timestamps.</div>';return}
 root.innerHTML=groupRows(rows).map(([day,items])=>'<div class="audit-date">'+esc(day)+' · '+items.length+' ACTIONS</div>'+items.map(r=>{
 const reversible=!!r.documentPath&&r.collection!=='contactMessages'&&r.collection!=='joinApplications'&&r.collection!=='challengeRegistrations'&&r.collection!=='notifications';
 const operation=(r.operation||'observed').toUpperCase();
 return '<article class="audit-row"><div class="audit-icon"><i class="fa-solid '+(r.operation==='delete'?'fa-trash':r.operation==='create'?'fa-plus':r.operation==='update'?'fa-pen':'fa-clock')+'"></i></div><div><div class="audit-title">'+esc(r.title||r.label||r.collection)+'</div><div class="audit-detail">'+esc(r.label||r.collection)+' · '+esc(operation)+' · '+esc(r.documentPath||'historical record')+'</div><div class="audit-detail">'+esc(r.legacy?'Existing record timestamp; exact historical action is not available.':changes(r.before,r.after))+'</div><div class="audit-meta">'+esc(pretty(r.createdAt||r.clientAt))+' · '+esc(r.actor||'Actor not recorded')+(r.legacy?' · RECONSTRUCTED':' · AUDIT LOG')+'</div></div><div class="audit-actions">'+(r.url?'<a class="audit-action" target="_blank" rel="noopener" href="'+esc(r.url)+'">Details</a>':'')+(r.id&&reversible&&!r.legacy?'<button class="audit-action danger" data-undo="'+esc(r.id)+'">Undo</button>':'')+'</div></article>';
 }).join('')).join('');
}
async function load(){
 const root=$('liveAuditList');if(!root)return;root.innerHTML='<div class="audit-empty"><i class="fa-solid fa-spinner fa-spin"></i> Loading complete activity history…</div>';
 try{
  const u=auth.currentUser;if(!u||u.email!==ADMIN)throw Error('Admin sign-in required.');
  let auditError='';
  try{const snap=await dbRef().orderBy('createdAt','desc').limit(500).get();allRows=snap.docs.map(d=>({id:d.id,...d.data()}));}
  catch(e){auditError=e.message;allRows=[];}
  await loadLegacy();
  render();
  $('auditCount').textContent=allRows.length+' entries'+(auditError?' · live capture awaiting rules':'');
  if(auditError){const note=document.createElement('div');note.className='audit-note';note.textContent='Historical records are shown below. New reversible audit capture will start after the adminAuditLogs Firestore rule is deployed. Current rules blocked the audit log read: '+auditError;root.prepend(note);}
 }catch(e){root.innerHTML='<div class="audit-empty">Activity history unavailable: '+esc(e.message)+'</div>'}
}
async function loadLegacy(){
 const specs=[['players','Player'],['tournaments','Tournament'],['gallery','Gallery item'],['clips','Clip'],['announcements','Announcement'],['contactMessages','Contact message'],['joinApplications','Application'],['challengeRegistrations','Challenge registration']];
 const seen=new Set(allRows.map(r=>r.documentPath));
 for(const [collection,label] of specs){
  try{const snap=await db.collection(collection).get();snap.forEach(doc=>{const d=doc.data()||{},stamp=d.updatedAt||d.createdAt||d.timestamp;if(!stamp)return;const path=collection+'/'+doc.id;if(seen.has(path))return;allRows.push({legacy:true,collection,label,title:label+' · '+val(d),documentPath:path,operation:d.updatedAt?'updated':'created',createdAt:stamp,actor:d.updatedBy||d.createdBy||'',before:null,after:d})})}catch(e){console.warn('Legacy activity read skipped',collection,e)}
 }
 try{const s=await db.collection('adminStudioVersions').orderBy('createdAt','desc').limit(100).get();s.forEach(doc=>{const d=doc.data()||{};allRows.push({legacy:true,collection:'adminStudioVersions',label:'Experience Studio version',title:(d.status==='published'?'Published':'Saved')+' Experience Studio · '+(d.design?.preset||'custom'),documentPath:'adminStudioVersions/'+doc.id,operation:d.status||'saved',createdAt:d.createdAt,actor:d.updatedBy||'',url:null})})}catch(e){}
 allRows.sort((a,b)=>(dateOf(b.createdAt||b.clientAt)?.getTime()||0)-(dateOf(a.createdAt||a.clientAt)?.getTime()||0));
}
async function undo(id){
 const row=allRows.find(x=>x.id===id);if(!row)return;
 if(row.legacy){alert('Ye historical entry reconstructed hai. Iske exact previous state ka snapshot available nahi hai, isliye automatic Undo safe nahi hoga.');return}
 if(!row.documentPath||['contactMessages','joinApplications','challengeRegistrations','notifications'].includes(row.collection)){alert('This activity is not eligible for automatic Undo.');return}
 const action=row.operation==='create'?'created record delete hoga':row.operation==='delete'?'deleted record restore hoga':'record previous version par restore hoga';
 if(!confirm('Undo this action? '+action+'. A new audit entry will be created.'))return;
 try{
  const ref=db.doc(row.documentPath);
  if(row.operation==='create')await ref.delete();
  else if(row.before)await ref.set(row.before);
  else throw Error('Previous snapshot missing; safe undo is not possible.');
  alert('Undo completed. Previous state restored.');await load();
 }catch(e){alert('Undo failed: '+e.message)}
}
function mount(){
 const main=document.querySelector('body > .main');if(!main||$('liveAuditPanel'))return;
 const section=document.createElement('section');section.id='liveAuditPanel';section.className='live-audit';
 section.innerHTML='<div class="live-audit-head"><div><div class="live-audit-kicker">REAL WEBSITE ACTIVITY · DATE-WISE HISTORY</div><h2><i class="fa-solid fa-clock-rotate-left" style="color:#ff963e"></i> Live Website Activity</h2><p>Admin panel se kiye gaye database changes aur available purana record history.</p></div><strong id="auditCount">Loading…</strong></div><div class="live-audit-tools"><input id="auditSearch" type="search" placeholder="Search activity…"><select id="auditFilter"><option value="all">All activity</option><option value="players">Players</option><option value="tournaments">Tournaments</option><option value="gallery">Gallery</option><option value="clips">Clips</option><option value="announcements">Announcements</option><option value="settings">Website settings</option></select><button id="auditRefresh"><i class="fa-solid fa-rotate"></i> Refresh</button></div><div id="liveAuditList"></div><div class="audit-note"><strong>History accuracy:</strong> New actions are recorded with before/after snapshots and can be reversed where safe. Older entries are reconstructed from timestamps and Experience Studio snapshots already stored in Firestore. Deleted records and past edits without an existing snapshot cannot be recreated or safely undone retroactively.</div>';
 const anchor=main.querySelector('.dashboard-section')||main.querySelector('.cc-heading-row')?.parentElement;
 if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(section,anchor.nextSibling);else main.append(section);
 section.addEventListener('click',e=>{const b=e.target.closest('[data-undo]');if(b)undo(b.dataset.undo)});
 $('auditRefresh').onclick=load;$('auditSearch').oninput=render;$('auditFilter').onchange=render;
 if(window.auth)auth.onAuthStateChanged(u=>{if(u&&u.email===ADMIN)load()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();