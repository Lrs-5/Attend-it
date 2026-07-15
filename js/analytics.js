// ===== Nexus HRMS · Analytics =====
(function(){
  const $ = s => document.querySelector(s);
  const session = JSON.parse(localStorage.getItem("nexus.session")||"null");
  if (!session) { location.replace("index.html"); return; }
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
  // Avatar
  const profile = JSON.parse(localStorage.getItem("nexus.profile")||"{}");
  const initials = (profile.name||"Jane Doe").split(/\s+/).map(s=>s[0]).slice(0,2).join("").toUpperCase();
  const av=$("#topAvatar"); if (profile.photo){ av.style.backgroundImage=`url(${profile.photo})`; av.textContent=""; } else av.textContent=initials;
  // Collect last 6 months
  const now = new Date();
  const months = [];
  for (let i=5;i>=0;i--){
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const k = mk(d);
    const plan = JSON.parse(localStorage.getItem("nexus.plan."+k)||"null");
    const att = JSON.parse(localStorage.getItem("nexus.att."+k)||"null");
    const c={present:0,wfh:0,leave:0};
    Object.values(att?.days||{}).forEach(v=>{ if(c[v]!==undefined) c[v]++; });
    const w = plan?.working || workingDaysInMonth(d);
    const attended = c.present + c.wfh + c.leave;
    months.push({date:d, label:d.toLocaleDateString(undefined,{month:"short"}), counts:c, working:w, pct: w?Math.round(attended/w*100):0});
  }
  const totalOffice = months.reduce((s,m)=>s+m.counts.present,0);
  const totalWfh = months.reduce((s,m)=>s+m.counts.wfh,0);
  const totalLeave = months.reduce((s,m)=>s+m.counts.leave,0);
  const nonZero =
months.filter(m =>
m.counts.present+
m.counts.wfh+
m.counts.leave>0
).length || 1;
  const avgOff = Math.round(totalOffice/nonZero);
  const avgWfh = Math.round(totalWfh/nonZero);
const lastPct = months[months.length-1].pct;
const score = lastPct;

// Quick Summary values
const latest = months[months.length-1];

$("#sumWorking").textContent = latest.working;
$("#sumOffice").textContent = latest.counts.present;
$("#sumWFH").textContent = latest.counts.wfh;
$("#sumLeave").textContent = latest.counts.leave;

// KPI counters
count($("#kScore"), score);
count($("#kOff"), avgOff);
count($("#kWfh"), avgWfh);
count($("#kLeave"), totalLeave);
  // ---------- Canvas charts (no libraries) ----------
  const ink = getCSS("--ink"), ink2 = getCSS("--ink-2"), stroke = "rgba(255,255,255,0.12)";
  const C1 = "#7c5cff", C2 = "#22d3ee", C3 = "#28d39a", C4 = "#ffb84d", C5 = "#ff5d7a";
  fitCanvas("chartMonthly", (ctx,w,h)=> drawBars(ctx,w,h, months.map(m=>m.pct), months.map(m=>m.label), "%", C2));
  fitCanvas("chartDonut", (ctx,w,h)=> drawDonut(ctx,w,h, [
    {label:"Office", value:totalOffice, color:C1},
    {label:"WFH",    value:totalWfh,    color:C2},
    {label:"Leave",  value:totalLeave,  color:C4},
  ]));
  // ---------- helpers ----------
  function mk(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"); }
  function workingDaysInMonth(d){
    const y=d.getFullYear(), m=d.getMonth(); const last=new Date(y,m+1,0).getDate(); let n=0;
    for (let i=1;i<=last;i++){ const wd=new Date(y,m,i).getDay(); if (wd!==0 && wd!==6) n++; } return n;
  }
  function getCSS(v){ return getComputedStyle(document.documentElement).getPropertyValue(v).trim()||"#fff"; }
  function count(el,target){
    const dur=900, start=performance.now();
    (function tick(t){
      const p=Math.min(1,(t-start)/dur);
      el.textContent = Math.round(target*(1-Math.pow(1-p,3)));
      if (p<1) requestAnimationFrame(tick);
    })(performance.now());
  }
  function fitCanvas(id, draw){
    const c = document.getElementById(id); if (!c) return;
    const resize = ()=>{
      const dpr = window.devicePixelRatio||1;
      const w = c.clientWidth, h = c.height;
      c.width = w*dpr; c.height = h*dpr;
      const ctx = c.getContext("2d");
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.clearRect(0,0,w,h);
      draw(ctx,w,h);
    };
    resize();
    window.addEventListener("resize", resize);
  }
  function drawBars(ctx,w,h,values,labels,suffix,color){
    const padL=36, padB=28, padT=16, padR=12;
    const cw = w-padL-padR, ch = h-padT-padB;
    const max = 100;
    ctx.strokeStyle = stroke; ctx.lineWidth=1; ctx.fillStyle = ink2; ctx.font="11px Inter,sans-serif";
    for (let i=0;i<=4;i++){
      const y = padT + ch*(i/4);
      ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(w-padR,y); ctx.stroke();
      ctx.fillText((100-i*25)+suffix, 4, y+4);
    }
    const bw = cw/values.length*0.55;
    const gap = cw/values.length;
    values.forEach((v,i)=>{
      const x = padL + gap*i + (gap-bw)/2;
      const bh = ch*(Math.min(v,max)/max);
      const y = padT + ch - bh;
      const grd = ctx.createLinearGradient(0,y,0,y+bh);
      grd.addColorStop(0, color); grd.addColorStop(1, "rgba(34,211,238,0.15)");
      ctx.fillStyle = grd;
      roundRect(ctx,x,y,bw,bh,6); ctx.fill();
      ctx.fillStyle = ink2;
      ctx.textAlign = "center";
      ctx.fillText(labels[i], x+bw/2, h-8);
      ctx.fillStyle = ink;
      ctx.fillText(v+"%", x+bw/2, y-4);
      ctx.textAlign = "left";
    });
  }
  function drawDonut(ctx,w,h,data){
    const cx=w/2, cy=h/2, r=Math.min(w,h)/2-20, ir=r-22;
    const total = data.reduce((s,d)=>s+d.value,0) || 1;
    let a = -Math.PI/2;
    data.forEach(d=>{
      const slice = (d.value/total)*Math.PI*2;
      ctx.beginPath();
      ctx.arc(cx,cy,r,a,a+slice);
      ctx.arc(cx,cy,ir,a+slice,a,true);
      ctx.closePath();
      ctx.fillStyle = d.color; ctx.fill();
      a += slice;
    });
    ctx.fillStyle = ink; ctx.font="600 18px Inter,sans-serif"; ctx.textAlign="center";
    ctx.fillText(total+" days", cx, cy-2);
    ctx.fillStyle = ink2; ctx.font="11px Inter,sans-serif";
    ctx.fillText("last 6 months", cx, cy+14);
    // legend
    ctx.textAlign="left"; ctx.font="11px Inter,sans-serif";
    data.forEach((d,i)=>{
      const y = h-14 - (data.length-1-i)*14;
      ctx.fillStyle = d.color; ctx.fillRect(10,y-8,10,10);
      ctx.fillStyle = ink2; ctx.fillText(`${d.label} (${d.value})`, 26, y);
    });
  }
  function drawLine(ctx,w,h,values,labels){
    const padL=30, padB=24, padT=16, padR=12;
    const cw = w-padL-padR, ch = h-padT-padB;
    ctx.strokeStyle = stroke; ctx.lineWidth=1;
    for (let i=0;i<=4;i++){
      const y = padT + ch*(i/4);
      ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(w-padR,y); ctx.stroke();
    }
    const step = cw/(values.length-1||1);
    const points = values.map((v,i)=>({x:padL+i*step, y: padT+ch-ch*(v/100)}));
    // area
    const grd = ctx.createLinearGradient(0,padT,0,padT+ch);
    grd.addColorStop(0,"rgba(124,92,255,0.45)"); grd.addColorStop(1,"rgba(124,92,255,0)");
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.moveTo(points[0].x, padT+ch);
    points.forEach(p=>ctx.lineTo(p.x,p.y));
    ctx.lineTo(points[points.length-1].x, padT+ch); ctx.closePath(); ctx.fill();
    // line
    ctx.strokeStyle = "#7c5cff"; ctx.lineWidth=2.4;
    ctx.beginPath(); points.forEach((p,i)=> i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.stroke();
    // dots + labels
    ctx.fillStyle = ink2; ctx.font="11px Inter,sans-serif"; ctx.textAlign="center";
    points.forEach((p,i)=>{
      ctx.beginPath(); ctx.arc(p.x,p.y,4,0,Math.PI*2); ctx.fillStyle="#22d3ee"; ctx.fill();
      ctx.fillStyle = ink2; ctx.fillText(labels[i], p.x, h-6);
    });
  }
  function drawStacked(ctx,w,h,months){
    const padL=30, padB=28, padT=16, padR=12;
    const cw = w-padL-padR, ch = h-padT-padB;
    const max = Math.max(
...months.map(m =>
m.counts.present+
m.counts.wfh+
m.counts.leave
),5);
    const gap = cw/months.length; const bw = gap*0.55;
    ctx.strokeStyle = stroke; ctx.lineWidth=1; ctx.fillStyle = ink2; ctx.font="11px Inter,sans-serif";
    for (let i=0;i<=4;i++){ const y=padT+ch*(i/4); ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(w-padR,y); ctx.stroke(); }
    months.forEach((m,i)=>{
      const x = padL + gap*i + (gap-bw)/2;
      const parts = [
        {v:m.counts.present, c:C1},
        {v:m.counts.wfh,     c:C2},
        {v:m.counts.leave,   c:C4},
      ];
      let yCursor = padT+ch;
      parts.forEach(p=>{
        const ph = ch*(p.v/max);
        ctx.fillStyle = p.c;
        roundRect(ctx, x, yCursor-ph, bw, ph, 4); ctx.fill();
        yCursor -= ph;
      });
      ctx.fillStyle = ink2; ctx.textAlign="center";
      ctx.fillText(m.label, x+bw/2, h-8);
    });
  }
  function roundRect(ctx,x,y,w,h,r){
    if (h<1){ctx.beginPath();ctx.rect(x,y,w,1);return;}
    r = Math.min(r, h/2, w/2);
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }
})();
