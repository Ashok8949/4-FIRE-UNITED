import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../admin/js/auth-guard.js',import.meta.url),'utf8');
function harness(user){let callback,signOuts=0;const redirects=[];const auth={onAuthStateChanged(handler){callback=handler},signOut:async()=>{signOuts++}};
 const document={body:{style:{visibility:'hidden'}}},window={location:{replace:path=>redirects.push(path)}};
 vm.runInNewContext(source,{auth,document,window,console});
 return{run:()=>callback(user),document,redirects,get signOuts(){return signOuts}};
}
test('verified configured admin can see the admin page',async()=>{
 const h=harness({email:'aks303603@gmail.com',getIdTokenResult:async()=>({claims:{email:'aks303603@gmail.com',email_verified:true}})});
 await h.run();assert.equal(h.document.body.style.visibility,'visible');assert.equal(h.redirects.length,0);assert.equal(h.signOuts,0);
});
test('non-admin and unverified accounts are signed out and redirected',async()=>{
 const nonAdmin=harness({email:'member@example.com',getIdTokenResult:async()=>({claims:{email:'member@example.com',email_verified:true}})});
 await nonAdmin.run();assert.equal(nonAdmin.signOuts,1);assert.deepEqual(nonAdmin.redirects,['login.html']);
 const unverified=harness({email:'aks303603@gmail.com',getIdTokenResult:async()=>({claims:{email:'aks303603@gmail.com',email_verified:false}})});
 await unverified.run();assert.equal(unverified.signOuts,1);assert.deepEqual(unverified.redirects,['login.html']);
});
test('unauthenticated users are redirected',async()=>{
 const h=harness(null);await h.run();assert.deepEqual(h.redirects,['login.html']);assert.equal(h.document.body.style.visibility,'hidden');
});
