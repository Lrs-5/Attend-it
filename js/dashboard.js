// ===== Nexus HRMS · Dashboard =====



(function(){
  const $ = s => document.querySelector(s);
  const session = JSON.parse(localStorage.getItem("nexus.session")||"null");
  if (!session) { location.replace("index.html"); return; }
  // Shared helpers
  const toast = (msg, type="ok")=>{
    const t=$("#toast"); t.textContent=msg; t.className="toast show "+type;
    setTimeout(()=>t.classList.remove("show"),2200);
  };
  document.addEventListener("click", e=>{
    const b=e.target.closest(".ripple"); if(!b) return;
    const r=b.getBoundingClientRect(); const ink=document.createElement("span");
    ink.className="ink"; const d=Math.max(r.width,r.height);
    ink.style.width=ink.style.height=d+"px";
    ink.style.left=(e.clientX-r.left-d/2)+"px"; ink.style.top=(e.clientY-r.top-d/2)+"px";
    b.appendChild(ink); setTimeout(()=>ink.remove(),600);
  });
  const sidebar = $("#sidebar");

$("#menuBtn")?.addEventListener("click", () => {
    sidebar.classList.add("open");
});

$("#closeSidebar")?.addEventListener("click", () => {
    sidebar.classList.remove("open");
});

// Close sidebar when clicking outside (mobile)
document.addEventListener("click", (e) => {
    if (
        window.innerWidth <= 780 &&
        sidebar.classList.contains("open") &&
        !sidebar.contains(e.target) &&
        !$("#menuBtn").contains(e.target)
    ) {
        sidebar.classList.remove("open");
    }
});
  $("#logoutBtn").addEventListener("click", ()=>{
    localStorage.removeItem("nexus.session");
    toast("Signed out","ok");
    setTimeout(()=>location.replace("index.html"),400);
  });
  // Profile
  const profile = JSON.parse(localStorage.getItem("nexus.profile")||"{}");
  const initials = (profile.name||"Jane Doe").split(/\s+/).map(s=>s[0]).slice(0,2).join("").toUpperCase();
  const setAvatar = (el, ph)=>{
    if (!el) return;
    if (profile.photo){ el.style.backgroundImage=`url(${profile.photo})`; el.textContent=""; }
    else { el.textContent=initials; }
  };
  setAvatar($("#topAvatar"));
  setAvatar($("#empAvatar"));
  $("#welcomeName").textContent = (profile.name||"Jane Doe").split(" ")[0];
  $("#empName").textContent = profile.name||"Jane Doe";
  $("#empRole").textContent = `${profile.designation||"Senior Engineer"} · ${profile.dept||"Engineering"}`;
  $("#empId").textContent = profile.id||"EMP-00421";
  // Date line
  const now = new Date();
  $("#dateLine").textContent = now.toLocaleDateString(undefined,{weekday:"long", day:"numeric", month:"long", year:"numeric"});
  // Attendance data
  const key = monthKey(now);
  const data = JSON.parse(localStorage.getItem("nexus.att."+key)||"null");
  const plan = JSON.parse(localStorage.getItem("nexus.plan."+key)||"null");
  $("#monthBadge").textContent = now.toLocaleDateString(undefined,{month:"long", year:"numeric"});
  let counts = {
    present:0,
    wfh:0,
    leave:0,
    working:0,
    remain:0,
    doneWorking:0
};
  if (data){
    Object.values(data.days||{}).forEach(v=>{ if(counts[v]!==undefined) counts[v]++; });
  }
  const totalWorking = plan?.working || workingDaysInMonth(now);
  counts.working = totalWorking;
  counts.doneWorking =
counts.present +
counts.wfh +
counts.leave;
  counts.remain = Math.max(0, totalWorking - counts.doneWorking);
  const attended = counts.present + counts.wfh + counts.leave;
  const pct = totalWorking ? Math.round((attended/totalWorking)*100) : 0;
  // Ring
  const C = 2*Math.PI*52;
  const ringFg = $("#ringFg");
  ringFg.style.strokeDasharray = C;
  setTimeout(()=>{ ringFg.style.strokeDashoffset = C - (C*pct/100); }, 100);
  animateCounter($("#attPct"), pct, "%");
  // Legend
  $("#legOffice").textContent = counts.present;
  $("#legWfh").textContent = counts.wfh;
  $("#legLeave").textContent = counts.leave;
  $("#legRemain").textContent = counts.remain;
  // Today status
  const todayKey = dayKey(now);
  const todayVal = data?.days?.[todayKey];
  const isWeekend = [0,6].includes(now.getDay());
  $("#todayStatus").textContent = isWeekend ? "Holiday" :
    todayVal ? capitalize(todayVal) : "Not marked";
  // Stat cards
  animateCounter($("#sOffice"), counts.present);
  animateCounter($("#sWfh"), counts.wfh);
  animateCounter($("#sLeave"), counts.leave);
  
  animateCounter($("#sRemain"), counts.remain);
  // Streak (consecutive non-absent working days ending today)
  let streak = 0;
  if (data){
    const d = new Date(now);
    while (true){
      const k = dayKey(d);
      const wd = d.getDay();
      if (wd!==0 && wd!==6){
        const v = data.days?.[k];
        if (v) streak++; else if (d < new Date(data.startedAt||0)) break; else break;
      }
      d.setDate(d.getDate()-1);
      if (streak>120) break;
    }
  }
  animateCounter($("#streakDays"), streak);
  // Monthly bars
  const setBar = (el, val) => {
    const w = totalWorking ? Math.round((val/totalWorking)*100) : 0;
    $(el).style.width = w+"%";
    return w;
  };
  $("#pctOffice").textContent = setBar("#barOffice", counts.present)+"%";
  $("#pctWfh").textContent = setBar("#barWfh", counts.wfh)+"%";
  $("#pctLeave").textContent = setBar("#barLeave", counts.leave)+"%";
  // Timeline (build from latest entries)
  const tl = $("#timeline");
  const entries = data?.days ? Object.entries(data.days).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,6) : [];
  if (!entries.length){
    tl.innerHTML = `<li><div class="tdot"></div><div class="ttext"><p>No activity yet</p><small>Open Attendance to mark your first day.</small></div></li>`;
  } else {
    tl.innerHTML = entries.map(([d,v])=>{
      const dt = new Date(d);
      return `<li><div class="tdot" style="background:${color(v)}"></div>
      <div class="ttext"><p>Marked <b>${capitalize(v)}</b></p>
      <small>${dt.toLocaleDateString(undefined,{weekday:"short", day:"numeric", month:"short"})}</small></div></li>`;
    }).join("");
  }
  // Helpers
  function monthKey(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"); }
  function dayKey(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
  function workingDaysInMonth(d){
    const y=d.getFullYear(), m=d.getMonth();
    const last = new Date(y,m+1,0).getDate(); let n=0;
    for (let i=1;i<=last;i++){ const wd = new Date(y,m,i).getDay(); if (wd!==0 && wd!==6) n++; }
    return n;
  }
  function capitalize(s){ return s ? s[0].toUpperCase()+s.slice(1) : ""; }
function color(v){
    return {
        present:"#28d39a",
        wfh:"#22d3ee",
        leave:"#ffb84d"
    }[v] || "#7c5cff";
}
  function animateCounter(el, target, suffix=""){
    if (!el) return;
    const dur=800, start=performance.now();
    function tick(t){
      const p=Math.min(1,(t-start)/dur);
      const v=Math.round(target*easeOut(p));
      el.textContent = v+suffix;
      if (p<1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  function easeOut(t){ return 1-Math.pow(1-t,3); }
})();




// ================= EXPORT ATTENDANCE REPORT =================

document.getElementById("exportExcel").addEventListener("click", exportAttendance);

function exportAttendance(){

    const rows = [];

    let totalWorking = 0;
    let totalOffice = 0;
    let totalWFH = 0;
    let totalLeave = 0;

    const now = new Date();

    // Last 6 months
    for(let i=5;i>=0;i--){

        const d = new Date(now.getFullYear(), now.getMonth()-i, 1);

        const key =
            d.getFullYear() +
            "-" +
            String(d.getMonth()+1).padStart(2,"0");

        const plan =
            JSON.parse(localStorage.getItem("nexus.plan."+key) || "null");

        const att =
            JSON.parse(localStorage.getItem("nexus.att."+key) || '{"days":{}}');

        const counts = {
            present:0,
            wfh:0,
            leave:0
        };

        Object.values(att.days || {}).forEach(status=>{

            if(status==="present") counts.present++;

            if(status==="wfh") counts.wfh++;

            if(status==="leave") counts.leave++;

        });

        const working = plan ? plan.working : 0;

        const attended =
            counts.present +
            counts.wfh +
            counts.leave;

        const percent =
            working
            ? Math.round(attended/working*100)
            : 0;

        rows.push({

            Month:d.toLocaleString("default",{month:"long"}),

            "Working Days":working,

            WFO:counts.present,

            WFH:counts.wfh,

            Leave:counts.leave,

            "Attendance %":percent+"%"

        });

        totalWorking += working;
        totalOffice += counts.present;
        totalWFH += counts.wfh;
        totalLeave += counts.leave;
    }

    const overall =
        totalWorking
        ? Math.round(
            ((totalOffice+totalWFH+totalLeave)/totalWorking)*100
        )
        : 0;

    rows.push({});

    rows.push({

        Month:"TOTAL",

        "Working Days":totalWorking,

        WFO:totalOffice,

        WFH:totalWFH,

        Leave:totalLeave,

        "Attendance %":overall+"%"

    });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Attendance Summary"
    );

    const today = new Date();

    const fileName =
        "Attendance_Report_" +
        today.getFullYear() +
        "_" +
        String(today.getMonth()+1).padStart(2,"0") +
        ".xlsx";

    XLSX.writeFile(workbook,fileName);

}