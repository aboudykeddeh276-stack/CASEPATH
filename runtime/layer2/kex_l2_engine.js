#!/usr/bin/env node
"use strict";
const crypto = require("node:crypto");
function canonical(v){
  if(v===null||typeof v==="string"||typeof v==="boolean") return JSON.stringify(v);
  if(typeof v==="number"){if(!Number.isSafeInteger(v))throw new TypeError("unsafe integer");return String(v);}
  if(Array.isArray(v))return "["+v.map(canonical).join(",")+"]";
  if(typeof v==="object")return "{"+Object.keys(v).sort().map(k=>JSON.stringify(k)+":"+canonical(v[k])).join(",")+"}";
  throw new TypeError("unsupported value");
}
function hash(v){return crypto.createHash("sha256").update(typeof v==="string"?v:canonical(v)).digest("hex");}
class ToTSafetyKernel{
  constructor(){this.lastAccepted=new Map();this.evidence=[];}
  validate(event){
    if(!event||typeof event!=="object")return{ok:false,reason:"INVALID_EVENT"};
    for(const k of ["event_id","node_id","coordinate","epoch","sequence","payload_hash","prev_hash"])if(event[k]===undefined)return{ok:false,reason:"MISSING_"+k.toUpperCase()};
    if(!/^[1-9][0-9]*:[1-9][0-9]*$/.test(event.coordinate))return{ok:false,reason:"ZERO_OR_INVALID_COORDINATE"};
    if(!Number.isSafeInteger(event.epoch)||event.epoch<1||!Number.isSafeInteger(event.sequence)||event.sequence<1)return{ok:false,reason:"INVALID_ORDER"};
    const key=event.node_id+"@"+event.coordinate,last=this.lastAccepted.get(key);
    if(last){
      if(event.epoch<last.epoch)return{ok:false,reason:"STALE_EPOCH"};
      if(event.epoch===last.epoch&&event.sequence<=last.sequence)return{ok:false,reason:"REPLAY_OR_REORDER"};
      if(event.prev_hash!==last.payload_hash)return{ok:false,reason:"CHAIN_BREAK"};
    }else if(event.prev_hash!=="GENESIS")return{ok:false,reason:"UNKNOWN_PREDECESSOR"};
    const computed=hash({node_id:event.node_id,coordinate:event.coordinate,epoch:event.epoch,sequence:event.sequence,payload:event.payload});
    if(computed!==event.payload_hash)return{ok:false,reason:"PAYLOAD_HASH_MISMATCH"};
    this.lastAccepted.set(key,{epoch:event.epoch,sequence:event.sequence,payload_hash:event.payload_hash});
    const receipt={type:"TOT_ACCEPT",event_id:event.event_id,node_id:event.node_id,coordinate:event.coordinate,epoch:event.epoch,sequence:event.sequence,payload_hash:event.payload_hash};
    this.evidence.push(receipt);return{ok:true,receipt};
  }
}
class CoordinateDirectory{
  constructor(){this.records=new Map();}
  register(record){
    if(!record||!/^[1-9][0-9]*:[1-9][0-9]*$/.test(record.coordinate))return{ok:false,reason:"INVALID_COORDINATE"};
    const current=this.records.get(record.coordinate);
    if(current&&hash(current)!==hash(record))return{ok:false,reason:"COORDINATE_COLLISION",existing:current,incoming:record};
    this.records.set(record.coordinate,structuredClone(record));return{ok:true,record};
  }
  resolve(c){return this.records.get(c)||null;}
  snapshot(){return[...this.records.values()].sort((a,b)=>a.coordinate.localeCompare(b.coordinate));}
}
class Layer2Reconciler{
  constructor(kernel,directory){this.kernel=kernel;this.directory=directory;this.state=new Map();}
  ingest(event){
    const safety=this.kernel.validate(event);if(!safety.ok)return{status:"REJECTED",reason:safety.reason};
    const dir=this.directory.register({coordinate:event.coordinate,node_id:event.node_id,epoch:event.epoch,sequence:event.sequence,payload_hash:event.payload_hash});
    if(!dir.ok)return{status:"REJECTED",reason:dir.reason};
    return this.reconcileAdmitted(event,safety.receipt);
  }
  reconcileAdmitted(event,receipt=null){
    const key=event.coordinate,current=this.state.get(key);
    const incoming={node_id:event.node_id,epoch:event.epoch,sequence:event.sequence,payload:event.payload,payload_hash:event.payload_hash};
    if(!current||this.order(incoming)>this.order(current)){this.state.set(key,incoming);return{status:"APPLIED",reason:"CAUSALLY_NEWER",receipt};}
    if(this.order(incoming)===this.order(current)&&hash(current)!==hash(incoming))return{status:"CONFLICT",reason:"DIVERGENT_SAME_ORDER",existing:current,incoming};
    return{status:"IGNORED",reason:"DUPLICATE_OR_OLDER"};
  }
  order(x){return [x.epoch,x.sequence,x.node_id].join("|");}
  snapshot(){return[...this.state.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([coordinate,value])=>({coordinate,...value}));}
}
function makeEvent({node_id,coordinate,epoch,sequence,payload,prev_hash="GENESIS"}){
  const payload_hash=hash({node_id,coordinate,epoch,sequence,payload});
  return{event_id:payload_hash.slice(0,24),node_id,coordinate,epoch,sequence,payload,prev_hash,payload_hash};
}
function runFalsification(){
  const k=new ToTSafetyKernel(),d=new CoordinateDirectory(),r=new Layer2Reconciler(k,d),checks=[];
  const check=(name,fn,expected)=>{let actual;try{actual=fn();}catch(e){actual="THREW:"+e.message;}checks.push({name,expected,actual,pass:JSON.stringify(actual)===JSON.stringify(expected)});};
  const a=makeEvent({node_id:"N1",coordinate:"1:1",epoch:1,sequence:1,payload:{value:"A"}});
  check("baseline",()=>r.ingest(a).status,"APPLIED");
  check("duplicate",()=>r.ingest(a).status,"REJECTED");
  check("replay",()=>r.ingest(makeEvent({node_id:"N1",coordinate:"1:1",epoch:1,sequence:1,payload:{value:"A"}})).status,"REJECTED");
  check("stale_epoch",()=>r.ingest(makeEvent({node_id:"N1",coordinate:"1:1",epoch:0,sequence:2,payload:{value:"B"},prev_hash:a.payload_hash})).status,"REJECTED");
  const b=makeEvent({node_id:"N1",coordinate:"1:1",epoch:1,sequence:2,payload:{value:"B"},prev_hash:a.payload_hash});
  check("forward",()=>r.ingest(b).status,"APPLIED");
  check("chain_break",()=>r.ingest(makeEvent({node_id:"N1",coordinate:"1:1",epoch:1,sequence:3,payload:{value:"C"},prev_hash:"BAD"})).status,"REJECTED");
  check("zero_coordinate",()=>r.ingest(makeEvent({node_id:"N2",coordinate:"0:1",epoch:1,sequence:1,payload:{value:"X"}})).status,"REJECTED");
  check("coordinate_collision",()=>r.ingest(makeEvent({node_id:"N2",coordinate:"1:1",epoch:1,sequence:1,payload:{value:"X"}})).status,"REJECTED");
  const tampered=makeEvent({node_id:"N1",coordinate:"2:1",epoch:1,sequence:1,payload:{value:"Y"}});tampered.payload.value="TAMPERED";
  check("hash_tamper",()=>r.ingest(tampered).status,"REJECTED");
  check("unknown_predecessor",()=>r.ingest(makeEvent({node_id:"N3",coordinate:"3:1",epoch:1,sequence:1,payload:{value:"Z"},prev_hash:"NOT-GENESIS"})).status,"REJECTED");
  const localA=new Layer2Reconciler(new ToTSafetyKernel(),new CoordinateDirectory()),localB=new Layer2Reconciler(new ToTSafetyKernel(),new CoordinateDirectory());
  const e1=makeEvent({node_id:"N4",coordinate:"4:1",epoch:1,sequence:1,payload:{value:"P"}}),e2=makeEvent({node_id:"N4",coordinate:"4:1",epoch:1,sequence:1,payload:{value:"Q"}});
  localA.ingest(e1);localB.ingest(e2);
  const merge=new Layer2Reconciler(new ToTSafetyKernel(),new CoordinateDirectory());merge.reconcileAdmitted(e1);check("same_order_divergence",()=>merge.reconcileAdmitted(e2).status,"CONFLICT");
  const passed=checks.filter(x=>x.pass).length,report={schema:"kex.layer2.falsification.v2",tests:checks,passed,total:checks.length,all_passed:passed===checks.length,fault_classes:["duplicate","replay","stale_epoch","chain_break","zero_coordinate","coordinate_collision","hash_tamper","unknown_predecessor","same_order_divergence"],directory:d.snapshot(),state:r.snapshot()};
  report.receipt_hash=hash(report);return report;
}
if(require.main===module){const report=runFalsification();process.stdout.write(JSON.stringify(report,null,2)+"\n");process.exitCode=report.all_passed?0:1;}
module.exports={ToTSafetyKernel,CoordinateDirectory,Layer2Reconciler,makeEvent,runFalsification,hash};
