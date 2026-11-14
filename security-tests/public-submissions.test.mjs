import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createPublicSubmissionHandlers, validateContact, validateChallenge, validateJoin } = require("../functions/public-submissions.js");

test("contact validation rejects bad email, oversized content and extra fields", () => {
  assert.ok(validateContact({ name:"Ashok", email:"user@example.com", subject:"Hello", message:"Need help" }));
  assert.equal(validateContact({ name:"Ashok", email:"bad", subject:"Hello", message:"Need help" }), null);
  assert.equal(validateContact({ name:"Ashok", email:"user@example.com", subject:"Hello", message:"x".repeat(4001) }), null);
  assert.equal(validateContact({ name:"Ashok", email:"user@example.com", subject:"Hello", message:"Need help", status:"Approved" }), null);
});

test("challenge validation checks mode, UID, team and calendar date", () => {
  const value = { challengeType:"2V2", leaderName:"Leader", leaderUID:"123456789", whatsapp:"+919876543210", email:"user@example.com", teamName:"Fire Team", preferredDate:"2026-12-01", preferredTime:"18:30", message:"" };
  assert.ok(validateChallenge(value));
  assert.equal(validateChallenge({ ...value, challengeType:"5V5" }), null);
  assert.equal(validateChallenge({ ...value, leaderUID:"bad" }), null);
  assert.equal(validateChallenge({ ...value, preferredDate:"2026-02-31" }), null);
  assert.equal(validateChallenge({ ...value, teamName:"" }), null);
  assert.ok(validateChallenge({ ...value, challengeType:"1V1", teamName:"" }));
});

test("join validation enforces UID, email and field lengths", () => {
  const value = { name:"Player Name", ign:"FireIGN", uid:"123456789", email:"user@example.com", level:"50", rank:"Heroic", about:"Hello" };
  assert.ok(validateJoin(value));
  assert.equal(validateJoin({ ...value, uid:"123" }), null);
  assert.equal(validateJoin({ ...value, email:"bad" }), null);
  assert.equal(validateJoin({ ...value, about:"x".repeat(2001) }), null);
});

const response = () => ({ statusCode:0, body:null, status(code) { this.statusCode=code; return this; }, json(body) { this.body=body; return this; } });

test("handler rejects wrong methods, missing idempotency key and rate-limited requests", async () => {
  const handlers = createPublicSubmissionHandlers({
    db:{ collection(){return {doc(){return {id:"id"};}};}, runTransaction:async()=>{} },
    FieldValue:{ serverTimestamp:()=>1 }, Timestamp:{ fromMillis:value=>value },
    rateLimiter:{ allow:async()=>false }, hashKey:()=>"a".repeat(64)
  });
  let res=response();
  await handlers.contact({method:"GET",body:{},headers:{},ip:"127.0.0.1"},res);
  assert.equal(res.statusCode,405);
  res=response();
  await handlers.contact({method:"POST",body:{name:"Ashok",email:"a@b.com",subject:"Hi",message:"Hello"},headers:{},ip:"127.0.0.1"},res);
  assert.equal(res.statusCode,400);
  res=response();
  await handlers.contact({method:"POST",body:{name:"Ashok",email:"a@b.com",subject:"Hi",message:"Hello"},headers:{"idempotency-key":"abcdefghijklmnop"},ip:"127.0.0.1"},res);
  assert.equal(res.statusCode,429);
});

test("challenge submission generates its ID server-side and replays idempotently", async () => {
  const records=new Map();
  const db={
    collection(){return {doc(id){const key=id||"generated-record";return {id:key,key};}};},
    async runTransaction(callback){
      const writes=[];
      const tx={async get(ref){return {exists:records.has(ref.key),data:()=>records.get(ref.key)};},create(ref,data){writes.push([ref.key,data]);}};
      const result=await callback(tx);
      for(const [key,value] of writes)records.set(key,value);
      return result;
    }
  };
  const handlers=createPublicSubmissionHandlers({
    db, FieldValue:{serverTimestamp:()=>"SERVER_TIME"}, Timestamp:{fromMillis:value=>value},
    rateLimiter:{allow:async()=>true}, hashKey:()=>"b".repeat(64),
    now:()=>Date.UTC(2026,10,14,10), randomBytes:()=>Buffer.from([1,2,3,4])
  });
  const request={method:"POST",ip:"127.0.0.1",headers:{"idempotency-key":"abcdefghijklmnop"},body:{challengeType:"1V1",leaderName:"Leader",leaderUID:"123456789",whatsapp:"+919876543210",email:"user@example.com",teamName:"",preferredDate:"2026-12-01",preferredTime:"18:30",message:""}};
  let res=response();
  await handlers.challenge(request,res);
  assert.equal(res.statusCode,201);
  assert.equal(res.body.registrationId,"#4FU-01020304");
  const saved=[...records.values()].find(value=>value.registrationId);
  assert.equal(saved.status,"New");
  assert.equal(saved.selectedChallenge,"1V1");
  assert.equal(saved.createdAt,"SERVER_TIME");
  res=response();
  await handlers.challenge(request,res);
  assert.equal(res.statusCode,200);
  assert.equal(res.body.duplicate,true);
  assert.equal(res.body.registrationId,"#4FU-01020304");
  assert.equal(records.size,2);
});
