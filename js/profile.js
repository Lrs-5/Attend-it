(function(){
  const $ = s => document.querySelector(s);
  const session = JSON.parse(localStorage.getItem("nexus.session")||"null");
  if (!session) { location.replace("index.html"); return; }
  const toast = (msg,type="ok")=>{
    const t=$("#toast"); t.textContent=msg; t.className="toast show "+type;
    setTimeout(()=>t.classList.remove("show"),2000);
  };
  document.addEventListener("click", e=>{
    const b=e.target.closest(".ripple"); if(!b) return;
    const r=b.getBoundingClientRect(); const ink=document.createElement("span");
    ink.className="ink"; const d=Math.max(r.width,r.height);
    ink.style.width=ink.style.height=d+"px";
    ink.style.left=(e.clientX-r.left-d/2)+"px"; ink.style.top=(e.clientY-r.top-d/2)+"px";
    b.appendChild(ink); setTimeout(()=>ink.remove(),600);
  });
  $("#menuBtn")?.addEventListener("click", ()=> $("#sidebar").classList.toggle("open"));
  $("#logoutBtn").addEventListener("click", ()=>{ localStorage.removeItem("nexus.session"); location.replace("index.html"); });
  const defaults = {
    name:"Jane Doe", id:"EMP-00421", dept:"Engineering", designation:"Senior Engineer",
    manager:"Arjun Mehta", email:"jane.doe@nexus.com", phone:"+91 98765 43210",
    joining:"2022-01-17", package:2800000, location:"Bengaluru, IN",
    blood:"O+", emergency:"+91 99887 76655", photo:""
  };
  let profile = Object.assign({}, defaults, JSON.parse(localStorage.getItem("nexus.profile")||"{}"));
  const fields = {
    fName:"name", fId:"id", fEmail:"email", fPhone:"phone", fBlood:"blood",
    fLocation:"location", fDept:"dept", fDesig:"designation", fManager:"manager",
    fJoin:"joining", fPackage:"package", fEmergency:"emergency"
  };
  function paint(){
    const initials = (profile.name||"JD").split(/\s+/).map(s=>s[0]).slice(0,2).join("").toUpperCase();
    const topAv = $("#topAvatar"), bigAv = $("#bigAvatar");
    [topAv, bigAv].forEach(el=>{
      if (profile.photo){ el.style.backgroundImage = `url(${profile.photo})`; el.textContent=""; }
      else { el.style.backgroundImage=""; el.textContent = initials; }
    });
    $("#pName").textContent = profile.name;
    $("#pRole").textContent = `${profile.designation} · ${profile.dept}`;
    $("#pId").textContent = profile.id;
    $("#pLoc").textContent = profile.location;
    const jd = new Date(profile.joining);
    $("#pJoin").textContent = isNaN(jd) ? "Joined —" : "Joined "+jd.toLocaleDateString(undefined,{month:"short", year:"numeric"});
    Object.entries(fields).forEach(([k,v])=>{ const el=$("#"+k); if (el) el.value = profile[v] ?? ""; });
    setEditing(false);
  }
  let editing = false;
  function setEditing(on){
    editing = on;
    Object.keys(fields).forEach(k=> $("#"+k).disabled = !on);
    $("#editBtn").textContent = on ? "Editing…" : "Edit Profile";
    $("#saveBtn").disabled = !on; $("#cancelBtn").disabled = !on;
    $("#saveBtn").style.opacity = on?1:.5; $("#cancelBtn").style.opacity = on?1:.5;
  }
  $("#editBtn").addEventListener("click", ()=> { setEditing(true); $("#fName").focus(); toast("Profile editing enabled","ok"); });
  $("#cancelBtn").addEventListener("click", ()=> { paint(); toast("Changes discarded"); });
  $("#profileForm").addEventListener("submit", e=>{
    e.preventDefault();
    if (!editing) return;
    Object.entries(fields).forEach(([k,v])=> profile[v] = $("#"+k).value );
    profile.package = +profile.package || 0;
    localStorage.setItem("nexus.profile", JSON.stringify(profile));
    paint();
    toast("Profile saved","ok");
  });
  $("#changePhotoBtn").addEventListener("click", ()=> $("#photoInput").click());
  $("#photoInput").addEventListener("change", e=>{
    const file = e.target.files?.[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = ev=>{
      profile.photo = ev.target.result;
      localStorage.setItem("nexus.profile", JSON.stringify(profile));
      paint(); toast("Photo updated","ok");
    };
    reader.readAsDataURL(file);
  });
  paint();
})();
