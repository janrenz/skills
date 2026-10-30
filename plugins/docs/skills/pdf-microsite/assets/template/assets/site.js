(function(){
  "use strict";
  var root=document.documentElement;
  var reduced=window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Design umschalten ---------- */
  var tbtn=document.getElementById("theme"), tlabel=document.getElementById("themelabel"),
      darkMq=window.matchMedia("(prefers-color-scheme: dark)");
  function isDark(){ var t=root.getAttribute("data-theme"); return t ? t==="dark" : darkMq.matches; }
  function paint(){
    var label=isDark() ? "Zu hellem Design wechseln" : "Zu dunklem Design wechseln";
    tlabel.textContent=label; tbtn.title=label;
  }
  paint();
  tbtn.addEventListener("click", function(){
    var next=isDark() ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try{ localStorage.setItem("microsite-theme", next); }catch(e){}
    paint();
  });
  darkMq.addEventListener("change", function(){ if(!root.getAttribute("data-theme")) paint(); });

  /* ---------- Registerkarten ----------
     Im HTML stehen alle Panels offen untereinander (ohne JS, für Druck und für Agents).
     Erst hier entsteht die Tab-Leiste; die Beschriftung kommt aus data-tab. */
  var tabsets=[];
  [].forEach.call(document.querySelectorAll("[data-tabs]"), function(wrap){
    var panels=[].slice.call(wrap.querySelectorAll(":scope > .tabpanel"));
    var list=document.createElement("div");
    list.className="tablist"; list.setAttribute("role","tablist");
    list.setAttribute("aria-label", wrap.getAttribute("data-tabs"));
    var tabs=panels.map(function(p, i){
      var b=document.createElement("button");
      b.type="button"; b.id=p.id+"-tab"; b.setAttribute("role","tab");
      b.setAttribute("aria-controls", p.id);
      var no=document.createElement("span"); no.className="no"; no.textContent=String(i+1);
      b.appendChild(no); b.appendChild(document.createTextNode(p.getAttribute("data-tab")));
      p.setAttribute("role","tabpanel"); p.setAttribute("aria-labelledby", b.id); p.tabIndex=0;
      list.appendChild(b);
      return b;
    });
    function select(i, focus){
      tabs.forEach(function(t, j){
        var on=i===j;
        t.setAttribute("aria-selected", String(on)); t.tabIndex=on ? 0 : -1;
        panels[j].hidden=!on;
      });
      if(focus) tabs[i].focus();
      // Nur die Tab-Leiste mitscrollen (schmale Schirme), nie die Seite.
      var t=tabs[i], l=list;
      if(t.offsetLeft < l.scrollLeft || t.offsetLeft + t.offsetWidth > l.scrollLeft + l.clientWidth)
        l.scrollLeft=t.offsetLeft - 16;
    }
    tabs.forEach(function(t, i){
      t.addEventListener("click", function(){ select(i, false); });
      t.addEventListener("keydown", function(ev){
        var n=null, k=ev.key, len=tabs.length;
        if(k==="ArrowRight"||k==="ArrowDown") n=(i+1)%len;
        else if(k==="ArrowLeft"||k==="ArrowUp") n=(i-1+len)%len;
        else if(k==="Home") n=0; else if(k==="End") n=len-1;
        if(n!==null){ ev.preventDefault(); select(n, true); }
      });
    });
    wrap.insertBefore(list, panels[0]);
    wrap.classList.add("is-enhanced");
    select(0, false);
    tabsets.push({panels:panels, select:select});
  });
  // Suchtreffer in einem verborgenen Panel: dieses Panel zeigen.
  function reveal(node){
    tabsets.forEach(function(ts){
      ts.panels.forEach(function(p, i){ if(p.hidden && p.contains(node)) ts.select(i, false); });
    });
  }

  /* ---------- Inhaltsverzeichnis mobil einklappen ---------- */
  var tocbox=document.getElementById("tocbox"), here=document.getElementById("tochere"),
      wide=window.matchMedia("(min-width:1000px)");
  function syncToc(){ tocbox.open=wide.matches; }
  syncToc(); wide.addEventListener("change", syncToc);
  tocbox.addEventListener("click", function(ev){
    if(!wide.matches && ev.target.closest(".toc a")) tocbox.open=false;
  });

  /* ---------- Listen filtern ---------- */
  function initFilter(inputId, listSel, countId, emptyId){
    var input=document.getElementById(inputId), count=document.getElementById(countId), empty=document.getElementById(emptyId);
    if(!input) return;
    var items=[].slice.call(document.querySelectorAll(listSel)), total=items.length;
    input.addEventListener("input", function(){
      var q=input.value.trim().toLowerCase(), shown=0;
      items.forEach(function(li){
        var hit=!q || li.textContent.toLowerCase().indexOf(q)!==-1;
        li.hidden=!hit; if(hit) shown++;
      });
      count.textContent=shown+" von "+total;
      empty.hidden=shown!==0;
      if(shown===0) empty.textContent="Keine Treffer für „"+input.value.trim()+"“.";
    });
  }
  initFilter("pfilter", "#kommission .people > li", "pcount", "pempty");
  initFilter("rfilter", "#refs > li", "rcount", "rempty");

  /* ---------- Volltextsuche mit Markierung ---------- */
  var q=document.getElementById("q"), hitcount=document.getElementById("hitcount"),
      prevBtn=document.getElementById("prevhit"), nextBtn=document.getElementById("nexthit"),
      main=document.getElementById("inhalt"), hits=[], cur=-1;
  var SKIP={SCRIPT:1,STYLE:1,NOSCRIPT:1,MARK:1,SVG:1,TITLE:1,DESC:1,BUTTON:1};

  function clearMarks(){
    [].forEach.call(main.querySelectorAll("mark.hit"), function(m){
      var p=m.parentNode; p.replaceChild(document.createTextNode(m.textContent), m); p.normalize();
    });
    hits=[]; cur=-1;
  }
  function hiddenByUser(el){
    // Verborgene Tab-Panels werden durchsucht (reveal zeigt sie), ausgefilterte Listeneinträge nicht.
    for(var p=el; p && p!==main; p=p.parentNode){
      if(SKIP[p.nodeName.toUpperCase()]) return true;
      if(p.hidden && !p.classList.contains("tabpanel")) return true;
    }
    return false;
  }
  function highlight(term){
    var lower=term.toLowerCase(), targets=[], n;
    var walker=document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {acceptNode:function(node){
      if(!node.nodeValue || node.nodeValue.toLowerCase().indexOf(lower)===-1) return NodeFilter.FILTER_REJECT;
      return hiddenByUser(node.parentNode) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    }});
    while((n=walker.nextNode())) targets.push(n);
    targets.forEach(function(node){
      var text=node.nodeValue, low=text.toLowerCase(), idx, from=0, frag=document.createDocumentFragment();
      while((idx=low.indexOf(lower, from))!==-1){
        if(idx>from) frag.appendChild(document.createTextNode(text.slice(from, idx)));
        var mk=document.createElement("mark"); mk.className="hit"; mk.textContent=text.slice(idx, idx+term.length);
        frag.appendChild(mk); hits.push(mk); from=idx+term.length;
      }
      if(from<text.length) frag.appendChild(document.createTextNode(text.slice(from)));
      node.parentNode.replaceChild(frag, node);
    });
  }
  function updateTocCounts(){
    [].forEach.call(document.querySelectorAll("#toc a"), function(a){
      var sec=document.getElementById(a.hash.slice(1)), badge=a.querySelector(".cnt"),
          c=sec ? sec.querySelectorAll("mark.hit").length : 0;
      badge.textContent=c; badge.hidden=c===0;
      badge.setAttribute("aria-label", c===1 ? "1 Treffer" : c+" Treffer");
    });
  }
  function gotoHit(i){
    if(!hits.length) return;
    if(cur>=0 && hits[cur]) hits[cur].classList.remove("current");
    cur=(i+hits.length)%hits.length;
    var m=hits[cur];
    reveal(m);
    m.classList.add("current");
    m.scrollIntoView({block:"center", behavior: reduced.matches ? "auto" : "smooth"});
    hitcount.textContent=(cur+1)+" / "+hits.length+" Treffer";
  }
  function syncUrl(term){
    try{
      var u=new URL(location.href);
      if(term) u.searchParams.set("q", term); else u.searchParams.delete("q");
      history.replaceState(null, "", u);
    }catch(e){}
  }
  function run(){
    clearMarks();
    var term=q.value.trim();
    if(term.length<2){
      hitcount.textContent=term.length===1 ? "mind. 2 Zeichen" : "";
      updateTocCounts(); prevBtn.disabled=nextBtn.disabled=true; syncUrl(""); return;
    }
    highlight(term); updateTocCounts(); syncUrl(term);
    prevBtn.disabled=nextBtn.disabled=hits.length===0;
    if(!hits.length) hitcount.textContent="keine Treffer";
    else gotoHit(0);
  }
  var timer=null;
  q.addEventListener("input", function(){ clearTimeout(timer); timer=setTimeout(run, 180); });
  nextBtn.addEventListener("click", function(){ gotoHit(cur+1); });
  prevBtn.addEventListener("click", function(){ gotoHit(cur-1); });
  q.addEventListener("keydown", function(ev){
    if(ev.key==="Enter"){ ev.preventDefault(); clearTimeout(timer); if(!hits.length) run(); else gotoHit(ev.shiftKey ? cur-1 : cur+1); }
    if(ev.key==="Escape"){ q.value=""; run(); }
  });
  // Such-Links teilen: ?q=Matching öffnet die Seite mit markierten Treffern.
  var initial=new URLSearchParams(location.search).get("q");
  if(initial){ q.value=initial; run(); }

  /* ---------- aktueller Abschnitt + Lesefortschritt ---------- */
  var links=[].slice.call(document.querySelectorAll("#toc a")),
      sections=links.map(function(a){ return document.getElementById(a.hash.slice(1)); });
  function setCurrent(id){
    links.forEach(function(a){
      if(a.hash==="#"+id){ a.setAttribute("aria-current","location"); if(here) here.textContent=a.textContent.replace(/\d+\s*Treffer$/,"").trim(); }
      else a.removeAttribute("aria-current");
    });
  }
  var visible={};
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){ visible[e.target.id]=e.isIntersecting ? e.intersectionRatio : 0; });
    var best=null, bestV=0;
    sections.forEach(function(s){ var v=visible[s.id]||0; if(v>bestV){ bestV=v; best=s.id; } });
    if(best) setCurrent(best);
  }, {rootMargin:"-88px 0px -55% 0px", threshold:[0,.1,.3,.6,1]});
  sections.forEach(function(s){ io.observe(s); });

  var bar=document.getElementById("progress"), ticking=false;
  function onScroll(){
    ticking=false;
    var h=document.documentElement, max=(h.scrollHeight-h.clientHeight)||1;
    bar.style.transform="scaleX("+Math.min(1, Math.max(0, h.scrollTop/max)).toFixed(3)+")";
  }
  document.addEventListener("scroll", function(){ if(!ticking){ ticking=true; requestAnimationFrame(onScroll); } }, {passive:true});
  onScroll();

  /* ---------- Zitierangabe kopieren ---------- */
  var cbtn=document.getElementById("copycite"), cstat=document.getElementById("copystatus");
  if(cbtn) cbtn.addEventListener("click", function(){
    var text=document.getElementById("citetext").textContent.replace(/\s+/g," ").trim();
    function done(ok){ cstat.textContent=ok ? "Kopiert." : "Kopieren nicht möglich – bitte markieren."; setTimeout(function(){ cstat.textContent=""; }, 4000); }
    if(navigator.clipboard) navigator.clipboard.writeText(text).then(function(){ done(true); }, function(){ done(false); });
    else done(false);
  });
})();
