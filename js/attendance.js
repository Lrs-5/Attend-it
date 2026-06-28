// ===== Nexus HRMS · Attendance =====
(function(){
  const $ = s => document.querySelector(s);
  const session = JSON.parse(localStorage.getItem("nexus.session")||"null");
  if (!session) { location.replace("index.html"); return; }
  const toast = (msg,type="ok")=>{
    const t=$("#toast"); t.textContent=msg; t.className="toast show "+type;
    setTimeout(()=>t.classList.remove("show"),1800);
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
  $("#logoutBtn").addEventListener("click", ()=>{
    localStorage.removeItem("nexus.session"); location.replace("index.html");
  });
  // Avatar
  const profile = JSON.parse(localStorage.getItem("nexus.profile")||"{}");
  const initials = (profile.name||"Jane Doe").split(/\s+/).map(s=>s[0]).slice(0,2).join("").toUpperCase();
  const av=$("#topAvatar"); if (profile.photo){ av.style.backgroundImage=`url(${profile.photo})`; av.textContent=""; } else av.textContent=initials;
  // Determine month key
  const now = new Date();
  let currentKey = monthKey(now);
  const planKey = ()=> "nexus.plan."+currentKey;
  const attKey = ()=> "nexus.att."+currentKey;
  let plan = JSON.parse(localStorage.getItem(planKey())||"null");
  let att = JSON.parse(localStorage.getItem(attKey())||"null");
  // Setup modal
  const setupModal = $("#setupModal");
  function openSetup(prefill=true){
    $("#setMonth").value = currentKey;
    if (prefill && plan){
      $("#setWorking").value = plan.working;
      $("#setOffice").value = plan.office;
      $("#setWfh").value = plan.wfh;
      $("#setLeave").value = plan.leave;
    } else {
      $("#setWorking").value = workingDaysInMonth(now);
      $("#setOffice").value = Math.max(0, workingDaysInMonth(now)-4);
      $("#setWfh").value = 4;
      $("#setLeave").value = 0;
    }
    setupModal.classList.add("show");
  }
  function closeSetup(){ setupModal.classList.remove("show"); }
  if (!plan) openSetup(false);
  $("#reconfigBtn").addEventListener("click", ()=> openSetup(true));
  $("#setupForm").addEventListener("submit", e=>{
    e.preventDefault();
    const month = $("#setMonth").value;
    const w = +$("#setWorking").value, o=+$("#setOffice").value, h=+$("#setWfh").value, l=+$("#setLeave").value;
    if (!month) return toast("Please pick a month","err");
    if (w<=0) return toast("Working days must be > 0","err");
    currentKey = month;
    plan = {working:w, office:o, wfh:h, leave:l};
    localStorage.setItem(planKey(), JSON.stringify(plan));
    if (!localStorage.getItem(attKey())){
      att = {startedAt:new Date().toISOString(), days:{}};
      localStorage.setItem(attKey(), JSON.stringify(att));
    } else att = JSON.parse(localStorage.getItem(attKey()));
    closeSetup();
    toast("Month plan saved","ok");
    render();
  });
  // Render calendar + stats
  const CYCLE = ["present","wfh","leave","absent"];
  function render(){
    const [y,m] = currentKey.split("-").map(Number);
    const first = new Date(y, m-1, 1);
    const lastDay = new Date(y, m, 0).getDate();
    const startWd = first.getDay();
    $("#calTitle").textContent = first.toLocaleDateString(undefined,{month:"long",year:"numeric"});
    const cal = $("#calendar"); cal.innerHTML = "";
    for (let i=0;i<startWd;i++){ const d=document.createElement("div"); d.className="day empty"; cal.appendChild(d); }
    const today = new Date();
    const todayK = dayKey(today);
    for (let day=1; day<=lastDay; day++){
      const date = new Date(y, m-1, day);
      const k = dayKey(date);
      const wd = date.getDay();
      const isHoliday = wd===0 || wd===6;
      const cell = document.createElement("div");
      cell.className = "day";
      if (isHoliday) cell.classList.add("holiday");
      if (k === todayK) cell.classList.add("today");
      const v = att?.days?.[k];
      if (v) cell.classList.add(v);
      cell.innerHTML = `<span class="n">${day}</span><span class="lbl">${isHoliday?"Holiday":(v?capitalize(v):"")}</span>`;
      if (!isHoliday){
        cell.addEventListener("click", ()=>{
          const cur = att.days[k];
          const next = cur ? CYCLE[(CYCLE.indexOf(cur)+1)%CYCLE.length] : "present";
          att.days[k] = next;
          localStorage.setItem(attKey(), JSON.stringify(att));
          cell.classList.remove("present","wfh","leave","absent");
          cell.classList.add(next);
          cell.querySelector(".lbl").textContent = capitalize(next);
          updateStats();
          toast(`${formatShort(date)} → ${capitalize(next)}`,"ok");
        });
      }
      cal.appendChild(cell);
    }
    updateStats();
  }
  function updateStats(){
    const c={present:0,wfh:0,leave:0,absent:0};
    Object.values(att?.days||{}).forEach(v=>{ if(c[v]!==undefined) c[v]++; });
    const w = plan?.working || 0;
    const attended = c.present + c.wfh + c.leave;
    const pct = w ? Math.round(attended/w*100) : 0;
    const offPct = w ? Math.round(c.present/w*100) : 0;
    const wfhPct = w ? Math.round(c.wfh/w*100) : 0;
    const done = c.present+c.wfh+c.leave+c.absent;
    $("#kAtt").textContent = pct+"%"; $("#mAtt").style.width = pct+"%";
    $("#kOff").textContent = offPct+"%"; $("#mOff").style.width = offPct+"%";
    $("#kWfh").textContent = wfhPct+"%"; $("#mWfh").style.width = wfhPct+"%";
    $("#kLeave").textContent = c.leave;
    $("#kAbs").textContent = c.absent;
    $("#kDone").textContent = done;
    $("#kDoneSub").textContent = `of ${w} days`;
  }
  function monthKey(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"); }
  function dayKey(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
  function workingDaysInMonth(d){
    const y=d.getFullYear(), m=d.getMonth(); const last=new Date(y,m+1,0).getDate(); let n=0;
    for (let i=1;i<=last;i++){ const wd=new Date(y,m,i).getDay(); if (wd!==0 && wd!==6) n++; } return n;
  }
  function capitalize(s){ return s ? s[0].toUpperCase()+s.slice(1) : ""; }
  function formatShort(d){ return d.toLocaleDateString(undefined,{day:"numeric",month:"short"}); }
  if (plan) render();
})();
