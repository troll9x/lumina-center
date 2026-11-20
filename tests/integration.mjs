import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:5181';
assert(['127.0.0.1','localhost'].includes(new URL(base).hostname)&&new URL(base).port==='5181','Run only on the isolated local QA server, port 5181.');
const headers=(role='advisor',branch=1)=>({'content-type':'application/json','x-demo-role':role,'x-demo-branch':String(branch)});
async function data(role='advisor',branch=1){const r=await fetch(base+'/api/data',{headers:headers(role,branch)});assert.equal(r.status,200);return (await r.json()).state;}
async function action(role,name,payload,expected=200){const r=await fetch(base+'/api/action',{method:'POST',headers:headers(role),body:JSON.stringify({action:name,payload})});assert.equal(r.status,expected);return r.json();}
await data();await action('director','reset',{});
let s=await data();assert.equal(s.students.length,20);assert.equal((await data('director',0)).students.length,60);assert.equal((await data('teacher')).invoices.length,0);
const result=await action('advisor','studentEnroll',{name:'Học viên kiểm thử API',parent:'Phụ huynh kiểm thử',phone:'0901234567',grade:9,courseId:'LOP-1-0'});
s=await data('accountant');const inv=s.invoices.find(i=>i.studentId===result.id);assert.equal(inv.amount,1920000);assert(s.enrollments.some(e=>e.id===inv.enrollmentId));
await action('advisor','payment',{invoiceId:inv.id,amount:100000,method:'Tiền mặt'},400);
await action('accountant','payment',{invoiceId:inv.id,amount:1000000,method:'Chuyển khoản'});
s=await data('director',0);assert.equal(s.receipts.filter(r=>r.invoiceId===inv.id).reduce((a,r)=>a+r.amount,0),1000000);assert(s.audit.some(a=>a.action==='Ghi nhận thu'));
const run=await fetch(base+'/api/agent',{method:'POST',headers:headers(),body:JSON.stringify({mode:'rehearsal'})});const raw=await run.text();const events=raw.split('\n\n').filter(x=>x.startsWith('data: ')).map(x=>JSON.parse(x.slice(6)));assert.equal(events.at(-1).type,'done',JSON.stringify(events.at(-1)));
s=await data();assert.equal(s.drafts.length,3);assert.equal(s.tasks.length,4);assert.equal(s.messages.length,0);assert(!JSON.stringify(events).includes('0901000000'));
const draft=s.drafts.find(d=>d.kind==='Mời học tiếp');await action('advisor','approve',{id:draft.id,content:draft.content+' Cảm ơn Anh/Chị.'});s=await data();assert.equal(s.messages.length,1);assert.equal(s.drafts.find(d=>d.id===draft.id).status,'Đã gửi');await action('advisor','approve',{id:draft.id},400);
const second=await fetch(base+'/api/agent',{method:'POST',headers:headers(),body:JSON.stringify({mode:'rehearsal'})});await second.text();s=await data();assert.equal(s.tasks.length,4,'Repeated runs must not duplicate open tasks');
const real=await fetch(base+'/api/agent',{method:'POST',headers:headers(),body:JSON.stringify({mode:'llm'})});const realRaw=await real.text();assert(realRaw.includes('ANTHROPIC_API_KEY'),'Missing key must be explicit, never silently simulated');
const denied=await fetch(base+'/api/agent',{method:'POST',headers:headers('teacher'),body:JSON.stringify({mode:'rehearsal'})});assert.equal(denied.status,400);
console.log('PASS: shared D1 persistence, atomic enrolment, receipts, branch/role scope, streamed rehearsal, human approval, audit, missing-key error.');
