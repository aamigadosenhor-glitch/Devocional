const $ = (sel) => document.querySelector(sel);

const APP_VERSION = "v6";

function isLeapYear(year){
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function dayOfYearLocal(d){
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d - start;
  return Math.floor(diff / 86400000) + 1;
}

function dayIndex365(d){
  let doy = dayOfYearLocal(d);
  const leap = isLeapYear(d.getFullYear());
  const month = d.getMonth();
  if(leap && month > 1){
    doy -= 1;
  }
  if(doy < 1) doy = 1;
  if(doy > 365) doy = 365;
  return { doy, leap };
}

function formatDateBR(d){
  return d.toLocaleDateString("pt-BR", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
}

async function loadJSON(url){
  const res = await fetch(url, { cache: "no-store" });
  if(!res.ok) throw new Error(`Falha ao carregar ${url}`);
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

function renderDevotional(item, meta, now){
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

function normalizeSpotifyTrack(input){
  if(!input) return null;
  const s = String(input).trim();
  if(!s) return null;

  const m1 = s.match(/^spotify:track:([A-Za-z0-9]{10,})$/);
  if(m1) return m1[1];

  const m2 = s.match(/open\.spotify\.com\/(track|embed\/track)\/([A-Za-z0-9]{10,})/);
  if(m2) return m2[2];

  return null;
}

function normalizeSpotifyPlaylist(input){
  if(!input) return null;
  const s = String(input).trim();
  if(!s) return null;

  const m1 = s.match(/^spotify:playlist:([A-Za-z0-9]{10,})$/);
  if(m1) return m1[1];

  const m2 = s.match(/open\.spotify\.com\/(playlist|embed\/playlist)\/([A-Za-z0-9]{10,})/);
  if(m2) return m2[2];

  return null;
}

function showMusicCard(){
  const card = $("#musicCard");
  if(card) card.style.display = "block";
}

function hideMusicCard(){
  const card = $("#musicCard");
  if(card) card.style.display = "none";
  setMusicOpenLink(null);
}

function renderSpotifyEmbed(type, id, meta){
  const embed = $("#musicEmbed");
  const hint = $("#musicHint");
  const footer = $("#musicFooter");
  if(!embed || !hint || !footer) return;

  showMusicCard();
  setText("#musicBadge", `Dia ${meta.doy}`);

  if(type === "track"){
    hint.textContent = "Uma música selecionada para acompanhar a leitura de hoje.";
    const src = `https://open.spotify.com/embed/track/${id}?utm_source=generator`;
    embed.innerHTML = `<iframe style="border-radius:16px" src="${src}" width="100%" height="152" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
  setMusicOpenLink(`https://open.spotify.com/track/${id}`);
    footer.textContent = "O player aqui pode tocar só prévia. Para ouvir completa, use o botão Ouvir no Spotify.";
    return;
  }

  if(type === "playlist"){
    hint.textContent = "Uma playlist para acompanhar o devocional.";
    const src = `https://open.spotify.com/embed/playlist/${id}?utm_source=generator`;
    embed.innerHTML = `<iframe style="border-radius:16px" src="${src}" width="100%" height="352" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
  setMusicOpenLink(`https://open.spotify.com/playlist/${id}`);
    footer.textContent = "Se o player não aparecer, teste sem bloqueador de anúncios ou em janela anônima. Para ouvir completa, use o botão Ouvir no Spotify.";
    return;
  }
}

function bindShare(getState){
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
      // cancelado
    }
  });
}

function bindUpdateButton(reg){
  const btn = $("#btnUpdate");
  if(!btn) return;

  const show = () => { btn.style.display = "inline-flex"; };

  const doUpdate = async () => {
    try{
      if(reg && reg.waiting){
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }
      if("caches" in window){
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    }catch(e){
      // ignore
    }finally{
      location.reload();
    }
  };

  btn.addEventListener("click", doUpdate);

  if(reg){
    if(reg.waiting) show();
    reg.addEventListener("updatefound", () => {
      const sw = reg.installing;
      if(!sw) return;
      sw.addEventListener("statechange", () => {
        if(sw.state === "installed" && navigator.serviceWorker.controller){
          show();
        }
      });
    });
  } else {
    show();
  }
}

function tryRenderMusic(musicCfg, meta){
  if(!musicCfg || !musicCfg.enabled){
    hideMusicCard();
    return;
  }

  const mode = String(musicCfg.mode || "").toLowerCase().trim();

  const playlistId = normalizeSpotifyPlaylist(musicCfg.playlist);
  if(mode === "playlist" && playlistId){
    renderSpotifyEmbed("playlist", playlistId, meta);
    return;
  }

  const tracks = Array.isArray(musicCfg.tracks) ? musicCfg.tracks : [];
  if(tracks.length > 0){
    const idx = (meta.doy - 1) % tracks.length;
    const trackId = normalizeSpotifyTrack(tracks[idx]);
    if(trackId){
      renderSpotifyEmbed("track", trackId, meta);
      return;
    }

    const maybePlaylist = normalizeSpotifyPlaylist(tracks[idx]);
    if(maybePlaylist){
      renderSpotifyEmbed("playlist", maybePlaylist, meta);
      return;
    }
  }

  if(playlistId){
    renderSpotifyEmbed("playlist", playlistId, meta);
    return;
  }

  hideMusicCard();
}

async function main(){
  const now = new Date();
  const meta = dayIndex365(now);

  setText("#status", `Carregando, ${APP_VERSION}`);

  let devotionals = null;
  try{
    devotionals = await loadJSON("data/devocionais.json");
  }catch(e){
    setText("#status", "Não foi possível carregar os textos. Verifique sua conexão e recarregue.");
    console.error(e);
    return;
  }

  const item = devotionals[meta.doy - 1];
  renderDevotional(item, meta, now);
  setText("#status", "Atualiza automaticamente a cada dia.");

  try{
    const musicCfg = await loadJSON("data/musicas.json");
    tryRenderMusic(musicCfg, meta);
  }catch(e){
    hideMusicCard();
  }

  bindShare(() => ({
    badge: $("#badgeDay").textContent,
    date: $("#todayDate").textContent,
    title: $("#title").textContent,
    reading: $("#reading").textContent,
    message: $("#message").textContent,
    prayer: $("#prayer").textContent,
    practice: $("#practice").textContent
  }));

  const tick = () => {
    const now2 = new Date();
    const nm = nextMidnightLocal(now2);
    const secs = Math.max(0, Math.floor((nm - now2) / 1000));
    setText("#countdown", `Troca em ${secondsToHMS(secs)}`);
    if(now2.getDate() !== now.getDate() || now2.getMonth() !== now.getMonth() || now2.getFullYear() !== now.getFullYear()){
      location.reload();
    }
  };
  tick();
  setInterval(tick, 1000);

  if("serviceWorker" in navigator){
    try{
      const reg = await navigator.serviceWorker.register("./sw.js");
      bindUpdateButton(reg);
    }catch(e){
      bindUpdateButton(null);
    }
  } else {
    bindUpdateButton(null);
  }
}

main();