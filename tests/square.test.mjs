import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHmac, webcrypto, randomUUID } from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';
import { DatabaseSync } from 'node:sqlite';

const context = vm.createContext({ console, crypto: webcrypto, TextEncoder, Uint8Array, btoa, atob, Response, Request, URL, AbortSignal, Date });
const sql = new DatabaseSync(':memory:');
sql.exec(readFileSync('drizzle/0000_worried_vanisher.sql','utf8'));
sql.exec(readFileSync('drizzle/0001_brave_emma_frost.sql','utf8'));
const stamp=Date.now();
sql.prepare('INSERT INTO clients (id,email,name,created_at) VALUES (?,?,?,?)').run('c','client@example.com','Client',stamp);
sql.prepare('INSERT INTO projects (id,client_id,title,service,created_at) VALUES (?,?,?,?,?)').run('p','c','Test session','Photography',stamp);
sql.prepare('INSERT INTO invoices (id,number,project_id,client_id,items,currency,subtotal,total,deposit,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').run('i','SS-TEST','p','c','[]','cad',10000,10000,3000,stamp);
let env={SITE_URL:'https://studio.example',SQUARE_ACCESS_TOKEN:'test-only',SQUARE_LOCATION_ID:'loc',SQUARE_ENVIRONMENT:'sandbox',SQUARE_WEBHOOK_URL:'https://studio.example/api/webhooks/square',SQUARE_WEBHOOK_SIGNATURE_KEY:'secret'};
const orders=new Map(),links=new Map(),payments=new Map(),requests=new Map();
let creates=0,timeoutAfterCreate=false,wrongCurrency=false,deny=false;
context.fetch=async(url,opt={})=>{
 assert.ok(url.startsWith('https://connect.squareupsandbox.com/v2/'));
 const path=url.split('/v2/')[1];
 if(path==='locations/loc')return Response.json({location:{id:'loc',currency:wrongCurrency?'USD':'CAD',status:'ACTIVE',capabilities:['CREDIT_CARD_PROCESSING']}});
 if(path==='online-checkout/payment-links'&&opt.method==='POST'){
  const d=JSON.parse(opt.body);
  let link=requests.get(d.idempotency_key);
  if(!link){creates++;const id='link'+creates,orderId='order'+creates;link={id,order_id:orderId,url:'https://sandbox.square.link/u/'+id};const m=d.order.line_items[0].base_price_money;orders.set(orderId,{...d.order,id:orderId,total_money:m,state:'OPEN',tenders:[]});links.set(id,link);requests.set(d.idempotency_key,link)}
  if(timeoutAfterCreate){timeoutAfterCreate=false;throw new Error('simulated network timeout after Square created link')}
  return Response.json({payment_link:link});
 }
 if(path.startsWith('online-checkout/payment-links/')&&opt.method==='DELETE'){const link=links.get(path.split('/').at(-1));const o=orders.get(link.order_id);if(o.state==='COMPLETED')return Response.json({}, {status:409});o.state='CANCELED';return Response.json({id:link.id,cancelled_order_id:o.id})}
 if(path.startsWith('orders/'))return Response.json({order:orders.get(path.split('/')[1])});
 if(path.startsWith('payments/'))return Response.json({payment:payments.get(path.split('/')[1])});
 throw new Error('Unexpected provider request '+path);
};
class HttpError extends Error {constructor(message,status=400){super(message);this.status=status}}
const prepare=(q)=>({bind:(...p)=>({run:async()=>({meta:{changes:Number(sql.prepare(q).run(...p).changes)}}),first:async()=>sql.prepare(q).get(...p)||null,q,p})});
const server={config:()=>env,db:()=>({prepare,batch:async(stmts)=>{sql.exec('BEGIN');try{const r=stmts.map(s=>sql.prepare(s.q).run(...s.p));sql.exec('COMMIT');return r}catch(e){sql.exec('ROLLBACK');throw e}}}),HttpError,now:()=>Date.now(),uid:()=>randomUUID(),one:async(q,...p)=>sql.prepare(q).get(...p)||null,run:async(q,...p)=>({meta:{changes:Number(sql.prepare(q).run(...p).changes)}}),body:async r=>r.json(),sameOrigin:r=>{if(r.headers.get('origin')!==new URL(r.url).origin)throw new HttpError('Origin',403)},invoiceAccess:async id=>{if(deny)throw new HttpError('Unauthorized',401);const i=sql.prepare("SELECT i.*,c.email AS client_email,COALESCE((SELECT SUM(amount-refunded) FROM payments WHERE invoice_id=i.id),0) AS paid FROM invoices i JOIN clients c ON c.id=i.client_id WHERE i.id=?").get(id);if(!i)throw new HttpError('Missing',404);return {invoice:i}},json:(d,status=200)=>Response.json(d,{status}),failure:e=>Response.json({error:e.message},{status:e.status||503}),integrations:()=>({})};
const stub=new vm.SyntheticModule(Object.keys(server),function(){for(const[k,v]of Object.entries(server))this.setExport(k,v)},{context});
const cache=new Map();
async function module(path){if(cache.has(path))return cache.get(path);const code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;const m=new vm.SourceTextModule(code,{context,identifier:path});cache.set(path,m);await m.link(async spec=>{if(spec.endsWith('studio-server'))return stub;const p=spec.replace(/^@\//,'').replace(/^\.\//,'lib/')+'.ts';return module(p)});await m.evaluate();return m}
const core=(await module('lib/square-core.ts')).namespace;
assert.equal(core.checkoutAmount({total:10000,paid:0,deposit:3000},true),3000);
assert.equal(core.checkoutAmount({total:10000,paid:3000,deposit:3000},true),7000);
assert.throws(()=>core.checkoutAmount({total:10000,paid:10000,deposit:3000},false));
const raw='{"event_id":"test"}',url=env.SQUARE_WEBHOOK_URL;
assert.equal(await core.squareSignature('secret',url,raw),createHmac('sha256','secret').update(url+raw).digest('base64'));
assert.notEqual(await core.squareSignature('secret',url,raw+' '),await core.squareSignature('secret',url,raw));
const checkout=(await module('app/api/checkout/route.ts')).namespace;
const square=(await module('lib/square.ts')).namespace;
const webhook=(await module('app/api/webhooks/[provider]/route.ts')).namespace;
async function pay(deposit=false){return checkout.POST(new Request('https://studio.example/api/checkout',{method:'POST',headers:{origin:'https://studio.example','content-type':'application/json'},body:JSON.stringify({id:'i',deposit,amount:1})}))}
let r=await pay(true);assert.equal(r.status,200);const first=(await r.json()).url;assert.equal(creates,1);
r=await pay(true);assert.equal((await r.json()).url,first);assert.equal(creates,1);
r=await pay(false);assert.equal(r.status,200);assert.equal(creates,2);assert.equal(orders.get('order1').state,'CANCELED');
assert.equal(sql.prepare('SELECT amount FROM square_checkouts WHERE order_id=?').get('order2').amount,10000);
// Complete full payment; wrong amount and currency are rejected before persistence.
const payment={id:'pay1',order_id:'order2',location_id:'loc',amount_money:{amount:10000,currency:'CAD'},refunded_money:{amount:0,currency:'CAD'},status:'COMPLETED'};payments.set('pay1',payment);
let attempt=sql.prepare('SELECT * FROM square_checkouts WHERE order_id=?').get('order2');
assert.throws(()=>core.verifiedPayment({...payment,amount_money:{amount:1,currency:'CAD'}},attempt,orders.get('order2'),'loc'));
assert.throws(()=>core.verifiedPayment({...payment,location_id:'other'},attempt,orders.get('order2'),'loc'));
const event={event_id:'event1',type:'payment.updated',data:{object:{payment:{id:'pay1'}}}};
async function notify(event,valid=true){const body=JSON.stringify(event),sig=valid?await core.squareSignature('secret',url,body):'wrong';return webhook.POST(new Request(url,{method:'POST',headers:{'x-square-hmacsha256-signature':sig},body}),{params:Promise.resolve({provider:'square'})})}
assert.equal((await notify(event,false)).status,403);
assert.equal(sql.prepare('SELECT COUNT(*) n FROM payments').get().n,0);
assert.equal((await notify(event)).status,200);assert.equal((await notify(event)).status,200);
assert.equal(sql.prepare('SELECT COUNT(*) n FROM payments').get().n,1);
assert.equal((await pay()).status,400);
payment.refunded_money.amount=2000;await notify({...event,event_id:'refund1',type:'refund.updated',data:{object:{refund:{payment_id:'pay1'}}}});
assert.equal(sql.prepare('SELECT refunded FROM payments').get().refunded,2000);
payment.refunded_money.amount=1000;await square.reconcileSquarePayment('pay1');assert.equal(sql.prepare('SELECT refunded FROM payments').get().refunded,2000);
// Reject unauthorized access, lock contention, and incompatible Square currency.
deny=true;assert.equal((await pay()).status,401);deny=false;
sql.prepare('UPDATE invoices SET checkout_lock=?,checkout_expires=? WHERE id=?').run('other',Date.now()+100000,'i');assert.equal((await pay()).status,409);assert.equal(sql.prepare('SELECT checkout_lock FROM invoices').get().checkout_lock,'other');sql.exec('UPDATE invoices SET checkout_lock=NULL');
wrongCurrency=true;assert.equal((await pay()).status,400);wrongCurrency=false;
// A timeout after remote creation reuses the durable request, not a second link.
timeoutAfterCreate=true;assert.equal((await pay()).status,503);const afterTimeout=creates;
assert.equal((await pay()).status,200);assert.equal(creates,afterTimeout);
assert.equal((await checkout.POST(new Request('https://studio.example/api/checkout',{method:'POST',headers:{origin:'https://other.example'},body:'{}'}))).status,403);
console.log('PASS: Square amount rules, HMAC/tampering, authorized checkout, retries/idempotency, locking, currency/location checks, duplicate events, refunds, and migration compatibility.');
