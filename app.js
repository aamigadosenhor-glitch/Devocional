const $ = (sel) => document.querySelector(sel);

function isLeapYear(year){
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function dayOfYearLocal(d){
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d - start;
  return Math.floor(diff / 86400000) + 1;
}

// Map leap years to a 365-day cycle by merging Feb 29 into the same devotional as Mar 1.
function dayIndex365(d){
  let doy = dayOfYearLocal(d);
  const leap = isLeapYear(d.getFullYear());
  const month = d.getMonth(); // 0 Jan, 1 Feb
  if(leap && month > 1){
    doy -= 1;
  }
  // If leap day Feb 29, doy stays 60, later Mar 1 also maps to 60.
  if(doy < 1) doy = 1;
  if(doy > 365) doy = 365;
  return { doy, leap };
}

function formatDateBR(d){
  return d.toLocaleDateString("pt-BR", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
}

async function loadDevotionals(){
  const res = await fetch("data/devocionais.json", { cache: "no-store" });
  if(!res.ok) throw new Error("Falha ao carregar os devocionais.");
  return await res.json();
}

function secondsToHMS(total){
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function nextMidnightLocal(d){
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
}

function setText(id, txt){
  const el = $(id);
  if(el) el.textContent = txt;
}

function render(item, meta, now){
  setText("#todayDate", formatDateBR(now));
  setText("#badgeDay", `Dia ${meta.doy} de 365`);
  setText("#title", item.title);
  setText("#reading", item.reading);
  setText("#message", item.message);
  setText("#prayer", item.prayer);
  setText("#practice", item.practice);

  const leapNote = $("#leapNote");
  if(meta.leap && now.getMonth() === 1 && now.getDate() === 29){
    leapNote.style.display = "flex";
  } else {
    leapNote.style.display = "none";
  }
}

function bindActions(getState){
  $("#btnShare").addEventListener("click", async () => {
    const st = getState();
    const txt = `${st.badge}\n${st.date}\n\n${st.title}\nLeitura: ${st.reading}\n\n${st.message}\n\nOração: ${st.prayer}\n\nPrática: ${st.practice}`;
    try{
      if(navigator.share){
        await navigator.share({ title: "Devocional 365", text: txt });
      }else{
        await navigator.clipboard.writeText(txt);
        alert("Copiado para a área de transferência.");
      }
    }catch(e){
      // usuário cancelou, tudo bem
    }
  });

  $("#btnToday").addEventListener("click", () => location.reload());

  $("#btnOffline").addEventListener("click", async () => {
    if(!("serviceWorker" in navigator)){
      alert("Seu navegador não suporta modo offline.");
      return;
    }
    const reg = await navigator.serviceWorker.getRegistration();
    if(reg){
      alert("Modo offline pronto, se você já abriu uma vez, funciona até sem internet.");
    }else{
      alert("Carregando modo offline, aguarde e recarregue a página.");
    }
  });
}

async function main(){
  const now = new Date();
  const meta = dayIndex365(now);

  setText("#status", "Carregando devocional de hoje...");
  try{
    const data = await loadDevotionals();
    const item = data[meta.doy - 1];
    render(item, meta, now);
    setText("#status", "Atualiza automaticamente a cada dia.");
    bindActions(() => ({
      badge: $("#badgeDay").textContent,
      date: $("#todayDate").textContent,
      title: $("#title").textContent,
      reading: $("#reading").textContent,
      message: $("#message").textContent,
      prayer: $("#prayer").textContent,
      practice: $("#practice").textContent
    }));
  }catch(e){
    setText("#status", "Não foi possível carregar os textos. Verifique sua conexão e recarregue.");
    console.error(e);
  }

  // countdown to next change
  const tick = () => {
    const now2 = new Date();
    const nm = nextMidnightLocal(now2);
    const secs = Math.max(0, Math.floor((nm - now2) / 1000));
    setText("#countdown", `Troca em ${secondsToHMS(secs)}`);
    // if date changed, reload to show new devotional
    if(now2.getDate() !== now.getDate() || now2.getMonth() !== now.getMonth() || now2.getFullYear() !== now.getFullYear()){
      location.reload();
    }
  };
  tick();
  setInterval(tick, 1000);

  // service worker
  if("serviceWorker" in navigator){
    try{
      await navigator.serviceWorker.register("./sw.js");
    }catch(e){
      // ignore
    }
  }
}

main();