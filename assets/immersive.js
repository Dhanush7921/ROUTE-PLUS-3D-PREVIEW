/* Small progressive-enhancement layer; planning remains owned by the copied engine. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  document.documentElement.classList.add('cinema-ready');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
  }), {threshold:.12});
  document.querySelectorAll('[data-cinema-reveal]').forEach(node => observer.observe(node));

  document.querySelectorAll('[data-scene]').forEach(button => {
    button.addEventListener('click', () => {
      const kind=button.dataset.scene;
      dispatchEvent(new CustomEvent('routeplus:scene', {detail:kind}));
      const chosen=kind==='temple'?['Devotional','Temples','Heritage']:['Nature','Waterfalls','Mountains'];
      document.querySelectorAll('#interest-options input').forEach(input => input.checked=chosen.includes(input.value));
      const form=document.getElementById('journey');
      form.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});
      document.querySelector('[name="origin"]').focus({preventScroll:true});
      document.getElementById('form-status').textContent=(kind==='temple'?'Devotional':'Nature')+' interests selected. Enter your route to see relevant stops and estimated detours.';
    });
  });

  document.querySelectorAll('.experience').forEach(card => {
    card.addEventListener('pointermove',event=>{
      if(reduced.matches||event.pointerType==='touch')return;
      const rect=card.getBoundingClientRect();
      card.style.setProperty('--tilt-x',((event.clientX-rect.left)/rect.width*6-3)+'deg');
      card.style.setProperty('--tilt-y',(-((event.clientY-rect.top)/rect.height*5-2.5))+'deg');
    });
    card.addEventListener('pointerleave',()=>{card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg');});
  });
  // Native smooth scrolling also obeys the OS preference in existing inline handlers.
  if(reduced.matches){
    const original=Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView=function(options){return original.call(this,typeof options==='object'?{...options,behavior:'instant'}:options);};
  }
})();
