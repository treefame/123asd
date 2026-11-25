(() => {
  const CONFIG = window.SONORA_CONFIG || {};
  const CLIENT_ID = CONFIG.soundcloudClientId || "";
  const STORE_KEY = "sonora-state-v1";
  const $ = (id) => document.getElementById(id);
  const readState = () => {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
  };
  let state = { profile:{name:"Гость",bio:""}, playlists:[], liked:[], ...readState() };
  let currentTrack = null;
  let queue = [];
  let currentIndex = 0;
  let widget = null;
  let widgetReady = false;
  let currentView = "home";
  let activeLibrary = "playlists";
  const save = () => localStorage.setItem(STORE_KEY, JSON.stringify(state));
  const escapeHTML = (s="") => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const duration = ms => { const sec=Math.floor((ms||0)/1000); return Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0"); };
  const artwork = t => t.artwork_url ? t.artwork_url.replace("-large","-t500x500") : "";
  const artist = t => t.user?.username || t.publisher_metadata?.artist || "Неизвестный исполнитель";
  const trackId = t => String(t.id);
  const isLiked = t => state.liked.some(x => trackId(x)===trackId(t));
  function persistProfile() {
    const name=state.profile.name||"Гость";
    $("side-name").textContent=name; $("top-name").textContent=name;
    $("side-avatar").textContent=$("top-avatar").textContent=$("profile-avatar").textContent=name.trim().charAt(0).toUpperCase()||"G";
    $("profile-name").value=state.profile.name==="Гость"?"":state.profile.name;
    $("profile-bio").value=state.profile.bio||"";
  }
  function renderPlaylistNav() {
    $("playlist-nav").innerHTML=state.playlists.length?state.playlists.map(p=>'<button class="playlist-link" data-playlist="'+escapeHTML(p.id)+'">♫ '+escapeHTML(p.name)+'</button>').join(""):'<p class="muted small">Пока пусто</p>';
    $("home-playlists").innerHTML=state.playlists.length?state.playlists.map(playlistCard).join(""):'<div class="empty-state">Создай свой первый плейлист — он появится здесь.</div>';
  }
  function playlistCard(p) {
    return '<div class="playlist-card" data-playlist="'+escapeHTML(p.id)+'"><div class="playlist-art">♫</div><div style="min-width:0"><strong>'+escapeHTML(p.name)+'</strong><p>'+p.tracks.length+' трек(ов) · '+escapeHTML(p.description||"Твой плейлист")+'</p></div></div>';
  }
  function renderTrackCards(tracks) {
    if(!tracks.length) return '<div class="empty-state">Ничего не найдено.</div>';
    return tracks.slice(0,8).map((t,i)=>'<article class="track-card"><div class="cover">'+(artwork(t)?'<img src="'+escapeHTML(artwork(t))+'" alt="" loading="lazy">':'♫')+'<button class="quick-play" data-play-index="'+i+'" aria-label="Слушать">▶</button></div><strong>'+escapeHTML(t.title)+'</strong><div class="artist">'+escapeHTML(artist(t))+'</div></article>').join("");
  }
  function renderResults(tracks) {
    $("results-count").textContent=tracks.length+" треков";
    $("search-results").innerHTML=tracks.length?tracks.map((t,i)=>'<div class="result-row"><img class="result-cover" src="'+escapeHTML(artwork(t)||"")+'" alt=""><div class="result-info"><strong>'+escapeHTML(t.title)+'</strong><span>'+escapeHTML(artist(t))+'</span></div><span class="result-duration">'+duration(t.duration)+'</span><div class="result-actions"><button class="round-action" data-add-index="'+i+'" title="Добавить в плейлист">＋</button><button class="round-action" data-like-index="'+i+'" title="В избранное">'+(isLiked(t)?"♥":"♡")+'</button><button class="round-action" data-play-index="'+i+'" title="Слушать">▶</button></div></div>').join(""):'<div class="empty-state">По этому запросу ничего не найдено.</div>';
    queue=tracks;
  }
  async function searchTracks(query) {
    if(!CLIENT_ID) {
      $("search-results").innerHTML='<div class="empty-state">Чтобы включить поиск SoundCloud, добавь Client ID в файл <b>config.js</b>. Инструкция есть в README.</div>';
      $("results-count").textContent="API не настроен"; return;
    }
    $("search-results").innerHTML='<div class="empty-state">Ищем музыку…</div>';
    try {
      const url=new URL("https://api-v2.soundcloud.com/search/tracks");
      url.searchParams.set("q",query||"trending"); url.searchParams.set("client_id",CLIENT_ID); url.searchParams.set("limit","24");
      const response=await fetch(url);
      if(!response.ok) throw new Error("SoundCloud API: "+response.status);
      const data=await response.json(); const tracks=data.collection||[];
      if(query){ $("results-title").textContent='Результаты поиска: "'+query+'"'; renderResults(tracks); }
      else { $("featured-tracks").innerHTML=renderTrackCards(tracks); queue=tracks; $("results-title").textContent="Популярные треки"; renderResults(tracks); }
    } catch(error) {
      $("search-results").innerHTML='<div class="empty-state">Не удалось получить треки из SoundCloud. Проверь Client ID и подключение к интернету.<br><span class="muted">'+escapeHTML(error.message)+'</span></div>';
    }
  }
  function setView(view) {
    currentView=view;
    ["home","search","library","playlist","profile"].forEach(v=>$(v+"-view").classList.toggle("hidden",v!==view));
    document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
    if(view==="library") renderLibrary();
    if(view==="profile") persistProfile();
    window.scrollTo(0,0);
  }
  function renderLibrary() {
    document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.library===activeLibrary));
    if(activeLibrary==="playlists") $("library-content").innerHTML=state.playlists.length?state.playlists.map(playlistCard).join(""):'<div class="empty-state">Плейлисты пока не созданы.</div>';
    else $("library-content").innerHTML=state.liked.length?state.liked.map(playlistCard).join(""):'<div class="empty-state">Сохраняй понравившиеся треки сердечком.</div>';
  }
  function openPlaylist(id) {
    const p=state.playlists.find(x=>x.id===id); if(!p)return;
    $("playlist-detail").innerHTML='<div class="playlist-detail-head"><div class="playlist-detail-art">♫</div><div><span class="eyebrow">ПЛЕЙЛИСТ</span><h1>'+escapeHTML(p.name)+'</h1><p>'+escapeHTML(p.description||"")+' · '+p.tracks.length+' трек(ов)</p><button class="text-button" id="delete-playlist">Удалить плейлист</button></div></div><div class="results-list">'+(p.tracks.length?p.tracks.map((t,i)=>'<div class="result-row"><img class="result-cover" src="'+escapeHTML(artwork(t)||"")+'" alt=""><div class="result-info"><strong>'+escapeHTML(t.title)+'</strong><span>'+escapeHTML(artist(t))+'</span></div><button class="round-action" data-play-index="'+i+'">▶</button><button class="round-action" data-remove-index="'+i+'" title="Убрать из плейлиста">×</button></div>').join(""):'<div class="empty-state">Добавь треки через поиск — нажми ＋ рядом с композицией.</div>')+'</div>';
    $("delete-playlist").onclick=()=>{if(confirm("Удалить плейлист?")){state.playlists=state.playlists.filter(x=>x.id!==id);save();renderPlaylistNav();setView("library");}};
    queue=p.tracks; setView("playlist");
  }
  function addToPlaylist(track) {
    if(!state.playlists.length){alert("Сначала создай плейлист.");return;}
    const choice=prompt("Введи название плейлиста:\n"+state.playlists.map(p=>p.name).join("\n"));
    const p=state.playlists.find(x=>x.name.toLowerCase()===String(choice||"").toLowerCase());
    if(!p)return; if(!p.tracks.some(x=>trackId(x)===trackId(track)))p.tracks.push(track); save(); renderPlaylistNav(); alert("Трек добавлен в «"+p.name+"».");
  }
  function toggleLike(track) {
    state.liked=isLiked(track)?state.liked.filter(x=>trackId(x)!==trackId(track)):[...state.liked,track];
    save(); $("player-like").textContent=isLiked(track)?"♥":"♡"; if(currentView==="library")renderLibrary();
  }
  function loadWidget() {
    if(window.SC && window.SC.Widget) { initWidget(); return; }
    if(document.getElementById("sc-widget-script"))return;
    const script=document.createElement("script");script.id="sc-widget-script";script.src="https://w.soundcloud.com/player/api.js";script.onload=initWidget;document.head.appendChild(script);
  }
  function initWidget() {
    if(widget||!window.SC)return;
    const iframe=document.createElement("iframe");iframe.id="sc-player";iframe.allow="autoplay";iframe.src="https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/&auto_play=false&hide_related=true&show_comments=false&show_user=false&visual=false";
    $("player-frame").appendChild(iframe);widget=window.SC.Widget(iframe);
    widget.bind(window.SC.Widget.Events.READY,()=>widgetReady=true);
    widget.bind(window.SC.Widget.Events.PLAY,()=>{$("play-toggle").textContent="Ⅱ";});
    widget.bind(window.SC.Widget.Events.PAUSE,()=>{$("play-toggle").textContent="▶";});
    widget.bind(window.SC.Widget.Events.FINISH,()=>playTrack(queue[(currentIndex+1)%queue.length],(currentIndex+1)%queue.length));
    widget.bind(window.SC.Widget.Events.PLAY_PROGRESS,e=>{$("progress-fill").style.width=e.relative+"%";$("elapsed").textContent=duration(e.currentPosition);});
    widget.bind(window.SC.Widget.Events.READY,()=>widget.setVolume(75));
  }
  function playTrack(track,index=0) {
    if(!track||!track.permalink_url)return;
    currentTrack=track;currentIndex=index;queue=queue.length?queue:[track];
    $("now-title").textContent=track.title;$("now-artist").textContent=artist(track);
    $("now-cover").innerHTML=artwork(track)?'<img src="'+escapeHTML(artwork(track))+'" style="width:100%;height:100%;object-fit:cover;border-radius:6px" alt="">':"♫";
    $("player-like").textContent=isLiked(track)?"♥":"♡";$("duration").textContent=duration(track.duration);
    loadWidget();
    const start=()=>widget.load(track.permalink_url,{auto_play:true,hide_related:true,show_comments:false,show_user:false,visual:false});
    if(widgetReady)start();else {const check=setInterval(()=>{if(widgetReady){clearInterval(check);start();}},150);setTimeout(()=>clearInterval(check),10000);}
  }
  function createPlaylist() {
    const name=$("playlist-name").value.trim();if(!name)return;
    state.playlists.push({id:Date.now().toString(36),name,description:$("playlist-description").value.trim(),tracks:[]});
    save();renderPlaylistNav();$("playlist-dialog").close();$("playlist-form").reset();
  }
  document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
  $("global-search").addEventListener("keydown",e=>{if(e.key==="Enter"){const q=e.target.value.trim();$("search-input").value=q;setView("search");searchTracks(q);}});
  $("search-submit").onclick=()=>searchTracks($("search-input").value.trim());
  $("search-input").addEventListener("keydown",e=>{if(e.key==="Enter")searchTracks(e.target.value.trim());});
  $("hero-search").onclick=$("show-search").onclick=()=>setView("search");
  $("new-playlist").onclick=$("home-create-playlist").onclick=()=>$("playlist-dialog").showModal();
  $("playlist-form").addEventListener("submit",e=>{e.preventDefault();createPlaylist();});
  $("playlist-nav").addEventListener("click",e=>{const b=e.target.closest("[data-playlist]");if(b)openPlaylist(b.dataset.playlist);});
  $("home-playlists").addEventListener("click",e=>{const b=e.target.closest("[data-playlist]");if(b)openPlaylist(b.dataset.playlist);});
  $("library-content").addEventListener("click",e=>{const b=e.target.closest("[data-playlist]");if(b)openPlaylist(b.dataset.playlist);});
  $("back-library").onclick=()=>setView("library");
  $("profile-pill").onclick=$("open-profile").onclick=()=>setView("profile");
  $("save-profile").onclick=()=>{state.profile={name:$("profile-name").value.trim()||"Гость",bio:$("profile-bio").value.trim()};save();persistProfile();$("profile-status").textContent="Профиль сохранён.";};
  document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{activeLibrary=b.dataset.library;renderLibrary();});
  document.body.addEventListener("click",e=>{
    const play=e.target.closest("[data-play-index]");if(play){const i=Number(play.dataset.playIndex);playTrack(queue[i],i);return;}
    const like=e.target.closest("[data-like-index]");if(like){toggleLike(queue[Number(like.dataset.likeIndex)]);return;}
    const add=e.target.closest("[data-add-index]");if(add){addToPlaylist(queue[Number(add.dataset.addIndex)]);return;}
    const remove=e.target.closest("[data-remove-index]");if(remove&&currentView==="playlist"){const p=state.playlists.find(x=>x.tracks.some(t=>queue[Number(remove.dataset.removeIndex)]&&trackId(t)===trackId(queue[Number(remove.dataset.removeIndex)])));if(p){p.tracks.splice(Number(remove.dataset.removeIndex),1);save();openPlaylist(p.id);}}
  });
  $("player-like").onclick=()=>{if(currentTrack)toggleLike(currentTrack);};
  $("play-toggle").onclick=()=>{if(widget&&widgetReady)widget.toggle();else if(currentTrack)playTrack(currentTrack,currentIndex);};
  $("player-next").onclick=()=>{if(queue.length)playTrack(queue[(currentIndex+1)%queue.length],(currentIndex+1)%queue.length);};
  $("back").onclick=()=>history.back();$("forward").onclick=()=>history.forward();
  persistProfile();renderPlaylistNav();renderResults([]);$("results-title").textContent="Популярные треки";
  if(CLIENT_ID)searchTracks("");else $("featured-tracks").innerHTML='<div class="empty-state">Добавь SoundCloud Client ID в config.js, чтобы загрузить музыку и начать поиск.</div>';
  $("featured-tracks").addEventListener("click",e=>{const b=e.target.closest("[data-play-index]");if(b)playTrack(queue[Number(b.dataset.playIndex)],Number(b.dataset.playIndex));});
})();