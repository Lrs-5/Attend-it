// ===== Nexus HRMS · Settings =====
(function(){
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);
  const session = JSON.parse(localStorage.getItem("nexus.session")||"null");
  if (!session) { location.replace("index.html"); return; }
  const toast = (msg,type="ok")=>{
    if (localStorage.getItem("nexus.notif")==="off") return;
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
  $("#logoutBtn").addEventListener("click", ()=> doConfirm("Logout","Sign out of this session?", logout));
  // Avatar
  const profile = JSON.parse(localStorage.getItem("nexus.profile")||"{}");
  const initials = (profile.name||"JD").split(/\s+/).map(s=>s[0]).slice(0,2).join("").toUpperCase();
  const av=$("#topAvatar"); if (profile.photo){ av.style.backgroundImage=`url(${profile.photo})`; av.textContent=""; } else av.textContent=initials;
  // Theme
  const dark = $("#darkToggle");
  const isLight = localStorage.getItem("nexus.theme")==="light";
  dark.checked = !isLight;
  if (isLight) document.body.classList.add("light");
  dark.addEventListener("change", ()=>{
    if (dark.checked){ document.body.classList.remove("light"); localStorage.setItem("nexus.theme","dark"); toast("Dark mode on"); }
    else { document.body.classList.add("light"); localStorage.setItem("nexus.theme","light"); toast("Light mode on"); }
  });
  // Notifications
  const notif = $("#notifToggle");
  notif.checked = localStorage.getItem("nexus.notif")!=="off";
  notif.addEventListener("change", ()=>{
    localStorage.setItem("nexus.notif", notif.checked?"on":"off");
    if (notif.checked) toast("Notifications enabled");
  });
  // Confirmation modal
  const modal = $("#confirmModal");
  let pending = null;
  function doConfirm(title,msg,fn){
    $("#confirmTitle").textContent = title;
    $("#confirmMsg").textContent = msg;
    pending = fn;
    modal.classList.add("show");
  }
  $("#confirmNo").addEventListener("click", ()=>{ modal.classList.remove("show"); pending=null; });
  $("#confirmYes").addEventListener("click", ()=>{
    modal.classList.remove("show");
    const fn = pending; pending=null; if (fn) fn();
  });
  $$("[data-action]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const a = btn.dataset.action;
      if (a==="resetAttendance") doConfirm("Reset attendance?","All calendars and monthly plans will be deleted.", ()=>{
        Object.keys(localStorage).filter(k=>k.startsWith("nexus.att.")||k.startsWith("nexus.plan.")).forEach(k=>localStorage.removeItem(k));
        toast("Attendance data cleared","ok");
      });
      if (a==="resetProfile") doConfirm("Reset profile?","Profile fields will return to defaults.", ()=>{
        localStorage.removeItem("nexus.profile");
        toast("Profile reset","ok");
      });
      if (a==="clearAll") doConfirm("Clear ALL data?","Everything stored in this browser will be wiped and you'll be signed out.", ()=>{
        localStorage.clear();
        toast("All data cleared","ok");
        setTimeout(()=>location.replace("index.html"),500);
      });
      if (a==="logout") doConfirm("Logout","Sign out of this session?", logout);
    });
  });
  function logout(){
    localStorage.removeItem("nexus.session");
    toast("Signed out","ok");
    setTimeout(()=>location.replace("index.html"),400);
  }
})();