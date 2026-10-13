// referral.js — UPDATED with NEW deployment ID Version 5 — Sir Name Only
const REFERRAL_API_URL = "https://script.google.com/macros/s/AKfycbyTna3jo7cF0SbM04DpFiSyiNi7JGgZ3ghVigfzyIpk1oR5CCQSKd-eDVqbpPlBrajR/exec";
const REFERRAL_SITE_URL = "https://bradleyhome.github.io/bradley-funeral/";

const Referral = {
  extractSirName(fullName){
    if(!fullName) return "";
    const parts = fullName.trim().split(/\s+/);
    return parts[parts.length-1].toUpperCase().replace(/[^A-Z0-9]/g,"");
  },
  getRefParam(){ return new URLSearchParams(location.search).get("ref")||""; },
  async checkAvailability(sirName){
    const s=(sirName||"").trim().toUpperCase();
    if(!s) return {ok:false};
    try{
      const qs=new URLSearchParams({action:"checkref", ref:s}).toString();
      const res=await fetch(REFERRAL_API_URL+"?"+qs);
      return await res.json();
    }catch(e){ return {ok:false, error:e.message}; }
  },
  async resolveRef(ref){
    const r=(ref||"").trim().toUpperCase();
    if(!r) return null;
    try{
      const qs=new URLSearchParams({action:"resolve", ref:r}).toString();
      const res=await fetch(REFERRAL_API_URL+"?"+qs);
      return await res.json();
    }catch{ return {found:false, sirName:r}; }
  },
  buildLink(sirName){ return REFERRAL_SITE_URL+"?ref="+encodeURIComponent(sirName.toUpperCase()); },
  async showBanner(){
    const ref=this.getRefParam();
    if(!ref) return;
    const banner=document.getElementById("refBanner");
    if(!banner) return;
    try{
      const info=await this.resolveRef(ref);
      const display = info && info.found ? `Sir ${ref} (${info.fullName})` : `Sir ${ref}`;
      banner.textContent=`✅ Referred by ${display} — 5 Levels 10,4,3,2,1 Locked 12 months`;
      banner.classList.remove("hidden");
    }catch{
      banner.textContent=`✅ Referred by Sir ${ref} — 5 Levels`;
      banner.classList.remove("hidden");
    }
    const refTexts=document.querySelectorAll(".refText");
    refTexts.forEach(el=>el.textContent=ref.toUpperCase());
  },
  attachToForm(){
    const nameInput=document.getElementById("inpName");
    const sirInput=document.getElementById("inpSir");
    const checkBtn=document.getElementById("checkBtn");
    const sirStatus=document.getElementById("sirStatus");
    if(nameInput && sirInput){
      nameInput.addEventListener("input",(e)=>{
        const sir=this.extractSirName(e.target.value);
        if(sir && !sirInput.dataset.manual) sirInput.value=sir;
      });
    }
    if(sirInput){ sirInput.addEventListener("input",()=>{ sirInput.dataset.manual="1"; }); }
    if(checkBtn && sirInput){
      checkBtn.addEventListener("click", async()=>{
        const sir=sirInput.value.trim().toUpperCase();
        if(!sir){ if(sirStatus) sirStatus.textContent="Enter sir name"; return; }
        if(sirStatus) sirStatus.textContent="Checking...";
        const result=await this.checkAvailability(sir);
        if(sirStatus){
          if(result.available) sirStatus.innerHTML=`<span style="color:#22c55e">✅ ${sir} is available!</span>`;
          else if(result.taken){
            const sug=sir+"2";
            sirStatus.innerHTML=`<span style="color:#ef4444">❌ ${sir} taken — try ${sug}</span>`;
          } else sirStatus.textContent="Check failed";
        }
      });
    }
  },
  async registerMember({fullName, sirName, phone, email, ref}){
    const payload={action:"lead", name:fullName, sirname:sirName, phone, email:email||"", ref:ref||this.getRefParam()||"BRADLEY"};
    const qs=new URLSearchParams(payload).toString();
    const res=await fetch(REFERRAL_API_URL+"?"+qs);
    return await res.json();
  }
};
document.addEventListener("DOMContentLoaded",()=>{ Referral.showBanner(); Referral.attachToForm(); });
window.Referral=Referral;
