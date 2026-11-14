(function(){
'use strict';
const REPO='Ashok8949/4-FIRE-UNITED',BRANCH='feature/festive-universe',API='https://api.github.com';
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function when(value){const d=new Date(value);return Number.isNaN(d.getTime())?'Recently':d.toLocaleString(undefined,{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});}
async function load(){
 const root=document.getElementById('recentWorkList');if(!root)return;
 root.innerHTML='<div class="recent-work-status"><i class="fa-solid fa-spinner fa-spin"></i> Loading recent website changes…</div>';
 try{
  const response=await fetch(API+'/repos/'+REPO+'/commits?sha='+encodeURIComponent(BRANCH)+'&per_page=12',{headers:{Accept:'application/vnd.github+json'}});
  if(!response.ok)throw new Error('GitHub history unavailable ('+response.status+')');
  const commits=await response.json();
  const rows=await Promise.all(commits.slice(0,10).map(async c=>{
   let files=[];try{const r=await fetch(API+'/repos/'+REPO+'/commits/'+c.sha,{headers:{Accept:'application/vnd.github+json'}});if(r.ok){const detail=await r.json();files=(detail.files||[]).map(f=>f.filename);}}catch(_){}
   return {sha:c.sha,message:c.commit?.message?.split('\n')[0]||'Website update',date:c.commit?.committer?.date||c.commit?.author?.date,files,url:c.html_url};
  }));
  if(!rows.length){root.innerHTML='<div class="recent-work-status">No commits found for this branch.</div>';return;}
  root.innerHTML=rows.map(item=>{
   const short=item.sha.slice(0,7),list=item.files.length?item.files.slice(0,5).join(' · ')+(item.files.length>5?' · +'+(item.files.length-5)+' more':''):'Open commit to inspect changed files';
   const undoUrl='https://github.com/'+REPO+'/actions/workflows/rollback-feature-change.yml';
   return '<article class="recent-work-item"><div><div class="recent-work-title">'+esc(item.message)+'</div><div class="recent-work-meta"><span><i class="fa-regular fa-clock"></i> '+esc(when(item.date))+'</span><span>Commit '+esc(short)+'</span><span>'+item.files.length+' files</span></div><div class="recent-work-files">'+esc(list)+'</div></div><div class="recent-work-actions"><a class="recent-work-link" href="'+esc(item.url)+'" target="_blank" rel="noopener"><i class="fa-brands fa-github"></i> Details</a><button class="recent-work-undo" type="button" data-sha="'+esc(item.sha)+'" data-undo="'+esc(undoUrl)+'"><i class="fa-solid fa-rotate-left"></i> Undo</button></div></article>';
  }).join('');
 }catch(error){root.innerHTML='<div class="recent-work-status">'+esc(error.message)+'. Refresh to try again.</div>';}
}
function mount(){
 if(document.getElementById('recentWorkPanel'))return;
 const main=document.querySelector('body > .main, body main, .admin-shell-main');
 if(!main)return;
 const panel=document.createElement('section');panel.id='recentWorkPanel';panel.className='recent-work-panel';
 panel.innerHTML='<div class="recent-work-head"><div><div class="recent-work-kicker">Website change history</div><h2><i class="fa-solid fa-clock-rotate-left" style="color:#ff8a37"></i> Recent Work & Undo</h2><p>Recent code changes across the website, including which files were changed.</p></div><button type="button" class="recent-work-refresh" id="refreshRecentWork"><i class="fa-solid fa-rotate"></i> Refresh</button></div><div class="recent-work-list" id="recentWorkList"><div class="recent-work-status">Loading…</div></div><div class="recent-work-note"><strong>Safe Undo:</strong> Undo copies the selected commit ID and opens the protected GitHub rollback workflow. Confirming there creates a new revert commit on <strong>'+BRANCH+'</strong>; it does not erase history or touch production/main.</div>';
 const anchor=main.querySelector('.cc-heading-row, #commandCenter, .command-center, .dashboard-section');
 if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(panel,anchor.nextSibling);else main.insertBefore(panel,main.children[1]||null);
 panel.querySelector('#refreshRecentWork').addEventListener('click',load);
 panel.addEventListener('click',async e=>{
  const btn=e.target.closest('.recent-work-undo');if(!btn)return;
  const sha=btn.dataset.sha;
  const command='$ErrorActionPreference = "Stop"\nSet-Location "C:\\Projects\\4FU-festive"\nif ((git status --porcelain).Length -gt 0) { throw "Working tree dirty hai. Pehle changes commit/stash karo." }\ngit fetch origin feature/festive-universe\nif ($LASTEXITCODE -ne 0) { throw "Fetch failed" }\ngit checkout feature/festive-universe\nif ($LASTEXITCODE -ne 0) { throw "Checkout failed" }\ngit pull --ff-only origin feature/festive-universe\nif ($LASTEXITCODE -ne 0) { throw "Pull failed" }\ngit merge-base --is-ancestor '+sha+' HEAD\nif ($LASTEXITCODE -ne 0) { throw "Selected change is not on this branch" }\ngit revert --no-edit '+sha+'\nif ($LASTEXITCODE -ne 0) { throw "Revert stopped. Resolve or run git revert --abort." }\ngit push origin HEAD:feature/festive-universe\nif ($LASTEXITCODE -ne 0) { throw "Push failed" }';
  try{await navigator.clipboard.writeText(command);alert('Safe Undo PowerShell script copied.\\n\\nPaste it into PowerShell and run. This creates a new revert commit on feature/festive-universe; it does not delete history or change production.');}
  catch(_){prompt('Copy this safe Undo PowerShell script:',command);}
 });
 load();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();