const f=typeof window<"u",at=f&&!("onscroll"in window)||typeof navigator<"u"&&/(gle|ing|ro)bot|crawl|spider/i.test(navigator.userAgent),nt=f&&"IntersectionObserver"in window,ct=f&&"classList"in document.createElement("p"),it=f&&window.devicePixelRatio>1,qt={elements_selector:".lazy",container:at||f?document:null,threshold:300,thresholds:null,data_src:"src",data_srcset:"srcset",data_sizes:"sizes",data_bg:"bg",data_bg_hidpi:"bg-hidpi",data_bg_multi:"bg-multi",data_bg_multi_hidpi:"bg-multi-hidpi",data_bg_set:"bg-set",data_poster:"poster",class_applied:"applied",class_loading:"loading",class_loaded:"loaded",class_error:"error",class_entered:"entered",class_exited:"exited",unobserve_completed:!0,unobserve_entered:!1,cancel_on_exit:!0,callback_enter:null,callback_exit:null,callback_applied:null,callback_loading:null,callback_loaded:null,callback_error:null,callback_finish:null,callback_cancel:null,use_native:!1,restore_on_error:!1},dt=t=>Object.assign({},qt,t),K=function(t,o){let e;const s="LazyLoad::Initialized",r=new t(o);try{e=new CustomEvent(s,{detail:{instance:r}})}catch{e=document.createEvent("CustomEvent"),e.initCustomEvent(s,!1,!1,{instance:r})}window.dispatchEvent(e)},Vt=(t,o)=>{if(!!o)if(!o.length)K(t,o);else for(let e=0,s;s=o[e];e+=1)K(t,s)},l="src",M="srcset",R="sizes",lt="poster",A="llOriginalAttrs",ut="data",z="loading",ft="loaded",gt="applied",Mt="entered",B="error",bt="native",pt="data-",ht="ll-status",a=(t,o)=>t.getAttribute(pt+o),Rt=(t,o,e)=>{var s=pt+o;if(e===null){t.removeAttribute(s);return}t.setAttribute(s,e)},O=t=>a(t,ht),_=(t,o)=>Rt(t,ht,o),N=t=>_(t,null),F=t=>O(t)===null,zt=t=>O(t)===z,Bt=t=>O(t)===B,P=t=>O(t)===bt,Ft=[z,ft,gt,B],Pt=t=>Ft.indexOf(O(t))>=0,g=(t,o,e,s)=>{if(!!t){if(s!==void 0){t(o,e,s);return}if(e!==void 0){t(o,e);return}t(o)}},S=(t,o)=>{if(ct){t.classList.add(o);return}t.className+=(t.className?" ":"")+o},i=(t,o)=>{if(ct){t.classList.remove(o);return}t.className=t.className.replace(new RegExp("(^|\\s+)"+o+"(\\s+|$)")," ").replace(/^\s+/,"").replace(/\s+$/,"")},$t=t=>{t.llTempImage=document.createElement("IMG")},Gt=t=>{delete t.llTempImage},_t=t=>t.llTempImage,j=(t,o)=>{if(!o)return;const e=o._observer;!e||e.unobserve(t)},Ut=t=>{t.disconnect()},Wt=(t,o,e)=>{o.unobserve_entered&&j(t,e)},$=(t,o)=>{!t||(t.loadingCount+=o)},Jt=t=>{!t||(t.toLoadCount-=1)},vt=(t,o)=>{!t||(t.toLoadCount=o)},Kt=t=>t.loadingCount>0,Zt=t=>t.toLoadCount>0,mt=t=>{let o=[];for(let e=0,s;s=t.children[e];e+=1)s.tagName==="SOURCE"&&o.push(s);return o},G=(t,o)=>{const e=t.parentNode;if(!e||e.tagName!=="PICTURE")return;mt(e).forEach(o)},Et=(t,o)=>{mt(t).forEach(o)},D=[l],Lt=[l,lt],y=[l,M,R],St=[ut],H=t=>!!t[A],yt=t=>t[A],It=t=>delete t[A],m=(t,o)=>{if(H(t))return;const e={};o.forEach(s=>{e[s]=t.getAttribute(s)}),t[A]=e},Qt=t=>{H(t)||(t[A]={backgroundImage:t.style.backgroundImage})},Xt=(t,o,e)=>{if(!e){t.removeAttribute(o);return}t.setAttribute(o,e)},h=(t,o)=>{if(!H(t))return;const e=yt(t);o.forEach(s=>{Xt(t,s,e[s])})},Yt=t=>{if(!H(t))return;const o=yt(t);t.style.backgroundImage=o.backgroundImage},At=(t,o,e)=>{S(t,o.class_applied),_(t,gt),e&&(o.unobserve_completed&&j(t,o),g(o.callback_applied,t,e))},Ot=(t,o,e)=>{S(t,o.class_loading),_(t,z),e&&($(e,1),g(o.callback_loading,t,e))},u=(t,o,e)=>{!e||t.setAttribute(o,e)},Z=(t,o)=>{u(t,R,a(t,o.data_sizes)),u(t,M,a(t,o.data_srcset)),u(t,l,a(t,o.data_src))},to=(t,o)=>{G(t,e=>{m(e,y),Z(e,o)}),m(t,y),Z(t,o)},oo=(t,o)=>{m(t,D),u(t,l,a(t,o.data_src))},eo=(t,o)=>{Et(t,e=>{m(e,D),u(e,l,a(e,o.data_src))}),m(t,Lt),u(t,lt,a(t,o.data_poster)),u(t,l,a(t,o.data_src)),t.load()},so=(t,o)=>{m(t,St),u(t,ut,a(t,o.data_src))},ro=(t,o,e)=>{const s=a(t,o.data_bg),r=a(t,o.data_bg_hidpi),n=it&&r?r:s;!n||(t.style.backgroundImage=`url("${n}")`,_t(t).setAttribute(l,n),Ot(t,o,e))},ao=(t,o,e)=>{const s=a(t,o.data_bg_multi),r=a(t,o.data_bg_multi_hidpi),n=it&&r?r:s;!n||(t.style.backgroundImage=n,At(t,o,e))},no=(t,o,e)=>{const s=a(t,o.data_bg_set);if(!s)return;const r=s.split("|");let n=r.map(b=>`image-set(${b})`);t.style.backgroundImage=n.join(),t.style.backgroundImage===""&&(n=r.map(b=>`-webkit-image-set(${b})`),t.style.backgroundImage=n.join()),At(t,o,e)},kt={IMG:to,IFRAME:oo,VIDEO:eo,OBJECT:so},co=(t,o)=>{const e=kt[t.tagName];!e||e(t,o)},io=(t,o,e)=>{const s=kt[t.tagName];!s||(s(t,o),Ot(t,o,e))},lo=["IMG","IFRAME","VIDEO","OBJECT"],uo=t=>lo.indexOf(t.tagName)>-1,Tt=(t,o)=>{o&&!Kt(o)&&!Zt(o)&&g(t.callback_finish,o)},Q=(t,o,e)=>{t.addEventListener(o,e),t.llEvLisnrs[o]=e},fo=(t,o,e)=>{t.removeEventListener(o,e)},U=t=>!!t.llEvLisnrs,go=(t,o,e)=>{U(t)||(t.llEvLisnrs={});const s=t.tagName==="VIDEO"?"loadeddata":"load";Q(t,s,o),Q(t,"error",e)},V=t=>{if(!U(t))return;const o=t.llEvLisnrs;for(let e in o){const s=o[e];fo(t,e,s)}delete t.llEvLisnrs},wt=(t,o,e)=>{Gt(t),$(e,-1),Jt(e),i(t,o.class_loading),o.unobserve_completed&&j(t,e)},bo=(t,o,e,s)=>{const r=P(o);wt(o,e,s),S(o,e.class_loaded),_(o,ft),g(e.callback_loaded,o,s),r||Tt(e,s)},po=(t,o,e,s)=>{const r=P(o);wt(o,e,s),S(o,e.class_error),_(o,B),g(e.callback_error,o,s),e.restore_on_error&&h(o,y),r||Tt(e,s)},W=(t,o,e)=>{const s=_t(t)||t;if(U(s))return;go(s,b=>{bo(b,t,o,e),V(s)},b=>{po(b,t,o,e),V(s)})},ho=(t,o,e)=>{$t(t),W(t,o,e),Qt(t),ro(t,o,e),ao(t,o,e),no(t,o,e)},_o=(t,o,e)=>{W(t,o,e),io(t,o,e)},J=(t,o,e)=>{uo(t)?_o(t,o,e):ho(t,o,e)},vo=(t,o,e)=>{t.setAttribute("loading","lazy"),W(t,o,e),co(t,o),_(t,bt)},X=t=>{t.removeAttribute(l),t.removeAttribute(M),t.removeAttribute(R)},mo=t=>{G(t,o=>{X(o)}),X(t)},Ct=t=>{G(t,o=>{h(o,y)}),h(t,y)},Eo=t=>{Et(t,o=>{h(o,D)}),h(t,Lt),t.load()},Lo=t=>{h(t,D)},So=t=>{h(t,St)},yo={IMG:Ct,IFRAME:Lo,VIDEO:Eo,OBJECT:So},Io=t=>{const o=yo[t.tagName];if(!o){Yt(t);return}o(t)},Ao=(t,o)=>{F(t)||P(t)||(i(t,o.class_entered),i(t,o.class_exited),i(t,o.class_applied),i(t,o.class_loading),i(t,o.class_loaded),i(t,o.class_error))},Oo=(t,o)=>{Io(t),Ao(t,o),N(t),It(t)},ko=(t,o,e,s)=>{!e.cancel_on_exit||!zt(t)||t.tagName==="IMG"&&(V(t),mo(t),Ct(t),i(t,e.class_loading),$(s,-1),N(t),g(e.callback_cancel,t,o,s))},To=(t,o,e,s)=>{const r=Pt(t);_(t,Mt),S(t,e.class_entered),i(t,e.class_exited),Wt(t,e,s),g(e.callback_enter,t,o,s),!r&&J(t,e,s)},wo=(t,o,e,s)=>{F(t)||(S(t,e.class_exited),ko(t,o,e,s),g(e.callback_exit,t,o,s))},Co=["IMG","IFRAME","VIDEO"],xt=t=>t.use_native&&"loading"in HTMLImageElement.prototype,xo=(t,o,e)=>{t.forEach(s=>{Co.indexOf(s.tagName)!==-1&&vo(s,o,e)}),vt(e,0)},No=t=>t.isIntersecting||t.intersectionRatio>0,jo=t=>({root:t.container===document?null:t.container,rootMargin:t.thresholds||t.threshold+"px"}),Do=(t,o,e)=>{t.forEach(s=>No(s)?To(s.target,s,o,e):wo(s.target,s,o,e))},Ho=(t,o)=>{o.forEach(e=>{t.observe(e)})},qo=(t,o)=>{Ut(t),Ho(t,o)},Vo=(t,o)=>{!nt||xt(t)||(o._observer=new IntersectionObserver(e=>{Do(e,t,o)},jo(t)))},Nt=t=>Array.prototype.slice.call(t),C=t=>t.container.querySelectorAll(t.elements_selector),Mo=t=>Nt(t).filter(F),Ro=t=>Bt(t),zo=t=>Nt(t).filter(Ro),Y=(t,o)=>Mo(t||C(o)),Bo=(t,o)=>{zo(C(t)).forEach(s=>{i(s,t.class_error),N(s)}),o.update()},Fo=(t,o)=>{!f||(o._onlineHandler=()=>{Bo(t,o)},window.addEventListener("online",o._onlineHandler))},Po=t=>{!f||window.removeEventListener("online",t._onlineHandler)},k=function(t,o){const e=dt(t);this._settings=e,this.loadingCount=0,Vo(e,this),Fo(e,this),this.update(o)};k.prototype={update:function(t){const o=this._settings,e=Y(t,o);if(vt(this,e.length),at||!nt){this.loadAll(e);return}if(xt(o)){xo(e,o,this);return}qo(this._observer,e)},destroy:function(){this._observer&&this._observer.disconnect(),Po(this),C(this._settings).forEach(t=>{It(t)}),delete this._observer,delete this._settings,delete this._onlineHandler,delete this.loadingCount,delete this.toLoadCount},loadAll:function(t){const o=this._settings;Y(t,o).forEach(s=>{j(s,this),J(s,o,this)})},restoreAll:function(){const t=this._settings;C(t).forEach(o=>{Oo(o,t)})}};k.load=(t,o)=>{const e=dt(o);J(t,e)};k.resetStatus=t=>{N(t)};f&&Vt(k,window.lazyLoadOptions);const jt=document.documentElement,Dt=document.querySelector("body"),I=300;let E=null,c={},L=!0,d=!1;const $o=["a[href]","area[href]",'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',"select:not([disabled]):not([aria-hidden])","textarea:not([disabled]):not([aria-hidden])","button:not([disabled]):not([aria-hidden])","iframe","object","embed","[contenteditable]",'[tabindex]:not([tabindex^="-"])'],Go=()=>{const t=`${window.innerWidth-document.body.offsetWidth}px`;jt.style.setProperty("--modal-scrollbar-compensate",t),Dt.classList.add("is-modal-active"),L=!1,setTimeout(()=>{L=!0},I)},Uo=()=>{L=!1,setTimeout(()=>{jt.style.removeProperty("--modal-scrollbar-compensate"),Dt.classList.remove("is-modal-active"),L=!0},I)},x=(t,o=!1)=>{if(t&&!d&&L||o){t.querySelector(".js-modal-window");const e=t.querySelector(".js-modal-content");if(o||c.beforeOpen(),E){const s=E.getAttribute("data-modal-content");s&&e&&(e.innerHTML=s)}t.setAttribute("aria-hidden",!1),t.classList.add("is-visible"),setTimeout(()=>{t.classList.add("is-active")},10),d=!0,o||(Go(),setTimeout(()=>{c.afterOpen()},I)),setTimeout(()=>{},I)}},v=(t,o=!1)=>{d&&L&&t&&(c.beforeClose(),t.setAttribute("aria-hidden",!0),t.classList.remove("is-active"),o||Uo(),setTimeout(()=>{t.scrollTop=0,t.querySelector(".js-modal-window").scrollTop=0,t.classList.remove("is-visible"),o||(d=!1,E&&E.focus(),c.afterClose())},I))},T=t=>{t&&typeof t=="function"&&t()},Wo=(t,o)=>{const e=o.querySelectorAll($o),s=Array.prototype.slice.call(e);if(!o.contains(document.activeElement))s[0].focus(),t.preventDefault();else{const r=s.indexOf(document.activeElement);t.shiftKey&&r===0&&(s[s.length-1].focus(),t.preventDefault()),!t.shiftKey&&r===s.length-1&&(s[0].focus(),t.preventDefault())}};c.beforeOpen=t=>{T(t)};c.beforeClose=t=>{T(t)};c.afterOpen=t=>{T(t)};c.afterClose=t=>{T(t)};c.init=()=>{document.addEventListener("click",t=>{const o=t.target;if(o.closest("[data-modal-open]")||o.hasAttribute("data-modal-open")){const e=o.getAttribute("data-modal-open")||o.closest("[data-modal-open]").getAttribute("data-modal-open"),s=e?document.querySelector(e):"";if(t.preventDefault(),d){const r=document.querySelector(".js-modal.is-active");r!==s&&(v(r,!0),x(s,!0))}else E=o.hasAttribute("data-modal-open")?o:o.closest("[data-modal-open]"),x(s)}else if(d&&(o.closest(".js-modal-close")||o.classList.contains("js-modal-close")||!o.closest(".js-modal-window")&&!o.classList.contains("js-modal-window"))){const e=o.classList.contains("js-modal")?o:o.closest(".js-modal")||"";t.preventDefault(),v(e)}}),document.addEventListener("keydown",t=>{const o=document.querySelector(".js-modal.is-active");if((t.code==="Escape"||t.key==="Escape")&&d){v(o);return}if((t.code==="Tab"||t.key==="Tab")&&d&&o){Wo(t,o);return}})};document.documentElement.openModal=c.open=(t,o)=>{const e=t&&typeof t=="string"?document.querySelector(t):"";if(E=null,T(o),d){const s=document.querySelector(".js-modal.is-active");s&&(v(s,!0),s!==e&&(v(s,!0),x(e,!0)))}else x(e)};document.documentElement.closeModal=c.close=t=>{const o=t&&typeof t=="string"?document.querySelector(t):"";o&&v(o)};Ht();window.addEventListener("resize",()=>{Ht()});function Ht(){let t=window.innerHeight*.01;document.documentElement.style.setProperty("--vh",`${t}px`)}document.querySelectorAll(".js-item");const tt=document.querySelector(".js-congratulation"),ot=document.querySelector(".js-tasks"),et=document.querySelector(".js-go-tasks");et&&et.addEventListener("click",()=>{tt&&tt.classList.toggle("is-active"),ot&&ot.classList.toggle("is-active")});const q=document.querySelector(".js-mem");let p,w=0;function st(){const t=rt(1,4);let o;for(let e=0;e<50&&t==p;e++)p=rt(1,4);p==1&&(o="top-left"),p==2&&(o="top-right"),p==3&&(o="bottom-left"),p==4&&(o="bottom-right"),w++,w>5&&(w=1),p=t,q&&(q.setAttribute("data-position",o),q.setAttribute("src",`./images/mem-${w}.png`))}setTimeout(()=>{st(),setInterval(()=>{st()},1e4)},5e3);function rt(t,o){return t=Math.ceil(t),o=Math.floor(o),Math.floor(Math.random()*(o-t+1))+t}c.init();new k({});