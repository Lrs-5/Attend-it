// ===== Nexus HRMS · Login =====
(function(){
  const $ = s => document.querySelector(s);
  const toast = (msg, type="ok") => {
    const t = $("#toast"); t.textContent = msg;
    t.className = "toast show " + type;
    setTimeout(()=>t.classList.remove("show"), 2400);
  };
  const showLoader = on => $("#loader").classList.toggle("hidden", !on);
  // Ripple effect
  document.addEventListener("click", e=>{
    const b = e.target.closest(".ripple"); if(!b) return;
    const r = b.getBoundingClientRect();
    const ink = document.createElement("span");
    ink.className = "ink";
    const d = Math.max(r.width, r.height);
    ink.style.width = ink.style.height = d+"px";
    ink.style.left = (e.clientX - r.left - d/2)+"px";
    ink.style.top = (e.clientY - r.top - d/2)+"px";
    b.appendChild(ink);
    setTimeout(()=>ink.remove(),600);
  });
  // Already logged in?
  if (localStorage.getItem("nexus.session")) {
    location.replace("dashboard.html");
    return;
  }
  // Prefill remembered username
  const remembered = localStorage.getItem("nexus.remember");
  if (remembered) { $("#username").value = remembered; $("#remember").checked = true; }
  // Show/hide password
  $("#togglePw").addEventListener("click", ()=>{
    const i = $("#password");
    i.type = i.type === "password" ? "text" : "password";
  });
  $("#forgot").addEventListener("click", e=>{
    e.preventDefault();
    toast("Password reset link sent to your work email", "ok");
  });
  function login(username, displayName){
    showLoader(true);
    setTimeout(()=>{
      const session = {
        username, name: displayName || "Jane Doe",
        loginAt: new Date().toISOString()
      };
      localStorage.setItem("nexus.session", JSON.stringify(session));
      if ($("#remember").checked) localStorage.setItem("nexus.remember", username);
      else localStorage.removeItem("nexus.remember");
      // Ensure default profile exists
      if (!localStorage.getItem("nexus.profile")){
        localStorage.setItem("nexus.profile", JSON.stringify({
          name: displayName || "Jane Doe",
          id:"EMP-00421", dept:"Engineering", designation:"Senior Engineer",
          manager:"Arjun Mehta", email: username.includes("@")?username:"jane.doe@nexus.com",
          phone:"+91 98765 43210", joining:"2022-01-17", package:2800000,
          location:"Bengaluru, IN", blood:"O+", emergency:"+91 99887 76655", photo:""
        }));
      }
      showLoader(false);
      toast("Welcome back!", "ok");
      setTimeout(()=>location.replace("dashboard.html"), 400);
    }, 900);
  }
  $("#loginForm").addEventListener("submit", e=>{
    e.preventDefault();
    const u = $("#username").value.trim();
    const p = $("#password").value.trim();
    if (!u || !p) return toast("Please enter both fields", "err");
    if (p.length < 4) return toast("Password too short", "err");
    login(u);
  });
  $("#demoBtn").addEventListener("click", ()=>{
    $("#username").value = "jane.doe@nexus.com";
    $("#password").value = "demo1234";
    login("jane.doe@nexus.com","Jane Doe");
  });
})();
