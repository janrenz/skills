// Läuft synchron im <head>, damit das gespeicherte Design vor dem ersten Zeichnen steht.
(function(){
  var r=document.documentElement;
  r.classList.remove("no-js"); r.classList.add("js");
  try{ var t=localStorage.getItem("swk-theme"); if(t==="dark"||t==="light") r.setAttribute("data-theme",t); }catch(e){}
})();
