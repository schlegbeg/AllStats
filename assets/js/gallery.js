/* AllStats: інтеграція прототипу Bolt/StackBlitz. */
(() => {
  'use strict';
  function initGallery() {
    const section=document.getElementById('analysis-gallery');
    if(!section || section.dataset.galleryReady) return;
    section.dataset.galleryReady='true';
    const root=section.querySelector('.tw-analysis-swiper');
    const wrapper=root.querySelector('.swiper-wrapper');
    const controls=section.querySelector('[data-gallery-controls]');
    const toggle=section.querySelector('.tw-analysis-toggle');
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    let swiper=null,manualPause=false,focused=false,modal=false,visible=false,trigger=null;
    let pausedTransition=null,resumeEndHandler=null,resumeEndTimer=null;
    const updateFocusState=()=>{
      const focusedElement=section.querySelector(':focus-visible');
      focused=!!focusedElement&&focusedElement!==toggle;
    };
    function cancelResumeCompletion(){
      if(resumeEndHandler)wrapper.removeEventListener('transitionend',resumeEndHandler);
      if(resumeEndTimer)clearTimeout(resumeEndTimer);
      resumeEndHandler=null;
      resumeEndTimer=null;
    }
    function pauseAtCurrentPosition(){
      if(!swiper)return;
      const visualTranslate=swiper.getTranslate();
      const wasAnimating=swiper.animating;
      if(wasAnimating){
        const targetTranslate=swiper.translate;
        const remainingDistance=Math.abs(targetTranslate-visualTranslate);
        const transitionCss=getComputedStyle(wrapper).transitionDuration.split(',')[0].trim();
        const cssDuration=parseFloat(transitionCss)*(transitionCss.endsWith('ms')?1:1000);
        const duration=Number.isFinite(cssDuration)&&cssDuration>0?cssDuration:swiper.params.speed;
        const startTranslate=Number.isFinite(swiper.previousTranslate)?swiper.previousTranslate:visualTranslate;
        const totalDistance=Math.abs(targetTranslate-startTranslate);
        const remainingMs=duration*(totalDistance?remainingDistance/totalDistance:0);
        if(remainingDistance>0.01){
          pausedTransition={targetTranslate,remainingMs:Math.max(1,remainingMs)};
        }
      }
      cancelResumeCompletion();
      swiper.autoplay.stop();
      swiper.setTransition(0);
      swiper.setTranslate(visualTranslate);
      if(wasAnimating)swiper.transitionEnd(false);
    }
    function resumePausedTransition(){
      if(!pausedTransition)return false;
      const saved=pausedTransition;
      pausedTransition=null;
      const remainingMs=Math.max(1,saved.remainingMs);
      resumeEndHandler=event=>{
        if(event.target!==wrapper||event.propertyName!=='transform')return;
        cancelResumeCompletion();
        sync();
      };
      wrapper.addEventListener('transitionend',resumeEndHandler);
      resumeEndTimer=setTimeout(()=>{
        if(!resumeEndHandler)return;
        swiper.setTransition(0);
        swiper.setTranslate(saved.targetTranslate);
        swiper.transitionEnd(false);
        cancelResumeCompletion();
        sync();
      },remainingMs+100);
      swiper.translateTo(saved.targetTranslate,remainingMs,false,false);
      return true;
    }
    function sync(){
      if(!swiper)return;
      const stop=manualPause||focused||modal||document.hidden||!visible||motion.matches;
      if(stop)pauseAtCurrentPosition();
      else if(!swiper.autoplay.running&&!resumeEndHandler&&!resumePausedTransition())swiper.autoplay.start();
      toggle.textContent=motion.matches?'Авторух вимкнено':manualPause?'Відновити':'Пауза';
      toggle.setAttribute('aria-pressed',String(manualPause));toggle.disabled=motion.matches;
    }
    const grid=['tw-grid','tw-grid-cols-1','tw-gap-5','md:tw-grid-cols-2','lg:tw-grid-cols-3'];
    if(typeof window.Swiper==='function'){
      try{
        root.classList.add('swiper');wrapper.classList.remove(...grid);
        swiper=new window.Swiper(root,{
          slidesPerView:1,slidesPerGroup:1,spaceBetween:20,loop:true,speed:motion.matches?0:6500,
          autoplay:{delay:0,disableOnInteraction:false,pauseOnMouseEnter:false},
          breakpoints:{768:{slidesPerView:2},1024:{slidesPerView:3}},
          pagination:{el:section.querySelector('.tw-analysis-pagination'),clickable:true,bulletElement:'button'},
          navigation:{nextEl:section.querySelector('.tw-analysis-next'),prevEl:section.querySelector('.tw-analysis-prev')},
          a11y:{enabled:true,prevSlideMessage:'Попередній розбір',nextSlideMessage:'Наступний розбір',paginationBulletMessage:'Перейти до розбору {{index}}',slideLabelMessage:'{{index}} із {{slidesLength}}'},
        });
        controls.hidden=false;controls.classList.remove('tw-hidden');sync();
      }catch(error){
        if(root.swiper)root.swiper.destroy(true,true);
        swiper=null;root.classList.remove('swiper');wrapper.classList.add(...grid);
        console.warn('Галерея працює у статичному режимі.',error);
      }
    }
    if('IntersectionObserver' in window)new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();},{threshold:0.15}).observe(root);
    else{visible=true;sync();}


    section.addEventListener('focusin',()=>{updateFocusState();sync();});
    section.addEventListener('focusout',()=>queueMicrotask(()=>{updateFocusState();sync();}));
    document.addEventListener('visibilitychange',sync);
    motion.addEventListener('change',()=>{if(swiper)swiper.params.speed=motion.matches?0:6500;sync();});
    toggle.addEventListener('click',()=>{manualPause=!manualPause;sync();});
    if(window.Fancybox && typeof window.Fancybox.bind==='function'){
      // Альбом містить лише п'ять посилань. Кнопки не створюють дублів.
      section.addEventListener('click',event=>{
        if(!(event.target instanceof Element))return;
        const button=event.target.closest('[data-gallery-trigger]');
        if(button){trigger=button;button.closest('article').querySelector('a[data-fancybox]').click();}
        else if(event.isTrusted){const link=event.target.closest('a[data-fancybox="allstats-gallery"]');if(link)trigger=link;}
      });
      window.Fancybox.bind('#analysis-gallery a[data-fancybox="allstats-gallery"]',{
        Hash:false,Thumbs:false,animated:!motion.matches,showClass:motion.matches?false:'f-fadeIn',hideClass:motion.matches?false:'f-fadeOut',
        Carousel:{transition:motion.matches?false:'fade'},Images:{initialSize:'fit',zoom:!motion.matches,Panzoom:{maxScale:3}},
        Toolbar:{display:{left:['infobar'],middle:[],right:['iterateZoom','close']}},
        l10n:{CLOSE:'Закрити',NEXT:'Наступна схема',PREV:'Попередня схема',MODAL:'Галерея розборів AllStats'},
        on:{init:()=>{modal=true;sync();},destroy:()=>{modal=false;const target=trigger;trigger=null;requestAnimationFrame(()=>{if(target?.isConnected)target.focus({preventScroll:true});updateFocusState();sync();});}},
      });
      section.querySelectorAll('[data-gallery-trigger]').forEach(button=>{button.hidden=false;button.classList.remove('tw-hidden');});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initGallery,{once:true});else initGallery();
})();

