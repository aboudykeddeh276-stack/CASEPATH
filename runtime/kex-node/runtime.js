const SEED_ID="KEX-NODE-PUBLIC-CASEPATH-20260921-7A3F91C2";
const CAPABILITY_ORDER=Object.freeze(["read","write","execute","observe"]);
const enc=new TextEncoder();

function canonical(value){
  if(value===null||typeof value==="string"||typeof value==="boolean") return JSON.stringify(value);
  if(typeof value==="number"){
    if(!Number.isSafeInteger(value)) throw new TypeError("Only safe integers are permitted in runtime state");
    return JSON.stringify(value);
  }
  if(Array.isArray(value)) return "["+value.map(canonical).join(",")+"]";
  if(typeof value==="object"){
    return "{"+Object.keys(value).sort().map(k=>JSON.stringify(k)+":"+canonical(value[k])).join(",")+"}";
  }
  throw new TypeError("Unsupported state type");
}
async function sha256Hex(value){
  const bytes=await crypto.subtle.digest("SHA-256",enc.encode(typeof value==="string"?value:canonical(value)));
  return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
function assert(condition,message){if(!condition)throw new Error(message)}

async function loadDefinition(){
  const response=await fetch("./node-definition.json",{cache:"no-store"});
  assert(response.ok,"definition fetch failed: "+response.status);
  const definition=await response.json();
  assert(definition.definition_id && definition.version,"invalid definition");
  assert(Array.isArray(definition.typed_ports),"typed ports missing");
  assert(Array.isArray(definition.capability_class),"capability class missing");
  return definition;
}
async function instantiate(definition,target){
  assert(target && target.name,"target profile missing");
  for(const required of definition.target_constraints.required){
    assert(target.capabilities.includes(required),"target capability missing: "+required);
  }
  const state={status:"CREATED",version:1};
  const observer={mode:"read-only",events:[]};
  const attribution={source:definition.definition_id,seed:SEED_ID};
  const integration_edges=definition.integration_edges.map(x=>({...x}));
  const lineage_material={definition_id:definition.definition_id,version:definition.version,target:target.name,seed:SEED_ID};
  const lineage_id=await sha256Hex(lineage_material);
  const instance_id=await sha256Hex({lineage_id,state_root:await sha256Hex(state),observer});
  return {instance_id,lineage_id,definition_id:definition.definition_id,target,state,observer,attribution,integration_edges,capability_class:[...definition.capability_class]};
}
function validate(definition,instance){
  assert(instance.definition_id===definition.definition_id,"definition lineage mismatch");
  assert(instance.capability_class.every(x=>definition.capability_class.includes(x)),"capability escalation");
  assert(instance.observer.mode==="read-only","observer boundary violated");
  assert(instance.integration_edges.every(e=>definition.integration_edges.some(d=>d.id===e.id)),"foreign integration edge");
  assert(instance.instance_id!==definition.definition_id,"instance identity collapsed into definition");
  return true;
}
function render(definition,instance,evidence){
  document.querySelector("#definition").textContent=definition.definition_id+" / v"+definition.version;
  document.querySelector("#instance").textContent=instance.instance_id.slice(0,20)+"…";
  document.querySelector("#capability").textContent=instance.capability_class.join(", ");
  document.querySelector("#evidence").textContent=evidence;
  document.querySelector("#status").textContent=evidence;
  document.querySelector("#output").textContent=JSON.stringify({seed:SEED_ID,definition,instance,evidence},null,2);
}
let definition=null,instance=null;
async function boot(){
  try{
    definition=await loadDefinition();
    document.querySelector("#status").textContent="definition loaded";
    document.querySelector("#instantiate").onclick=async()=>{
      instance=await instantiate(definition,{name:"CASEPATH-PUBLIC-RUNTIME",capabilities:["observe","execute"]});
      render(definition,instance,"INSTANCE_CREATED");
    };
    document.querySelector("#validate").onclick=()=>{
      assert(instance,"instantiate an instance first");
      validate(definition,instance);
      render(definition,instance,"RUNTIME_VALIDATED");
    };
    instance=await instantiate(definition,{name:"CASEPATH-PUBLIC-RUNTIME",capabilities:["observe","execute"]});
    validate(definition,instance);
    render(definition,instance,"BOOT_VALIDATED");
  }catch(error){
    document.querySelector("#dot").style.background="#b3261e";
    document.querySelector("#status").textContent="runtime fault";
    document.querySelector("#output").textContent=error.stack||String(error);
  }
}
boot();