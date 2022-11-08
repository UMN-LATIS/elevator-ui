import{d as $,f as O,c as W,w as M,m as Je,g as Ke,u as x,o as P,h as xe,R as Ze,_ as J,b as k,a as y,e as S,i as qe,j as Ge,F as Se,k as Pe,p as Ee,l as b,n as U,q as H,s as j,t as Ye,v as Xe,x as et,y as tt,z as D,A as nt,B as X,r as rt,T as at,C as ot,D as fe}from"./index.js";const lt={src:"https://dev.elevator.umn.edu/assets/instanceAssets/7.png",alt:"Elevator DCL Logo"},st=[{name:"Home",href:"https://dev.elevator.umn.edu"},{name:"About",href:"https://dev.elevator.umn.edu/dcl/page/view/1"},{name:"Collections",children:["Recent Collections",{name:"Weisman Art Museum",href:"https://dcl.elevator.umn.edu/search/s/f6200137-aee5-4a78-bf88-4c6f3689e06a"},{name:"American Studies, Dept. of",href:"https://dcl.elevator.umn.edu/search/s/5a3c5350-0e02-466f-8efb-3cd0b03bdc67"},null,{name:"All Collections",href:"https://dcl.elevator.umn.edu/search/listCollections"}]}],$e=$({__name:"Button",props:{href:{default:void 0},to:{default:void 0},variant:{default:"secondary"}},setup(e){const t=e,n=O(()=>t.href?"a":t.to?Ze:"button");return(a,r)=>(P(),W(Ke(x(n)),Je({class:["button inline-flex items-center gap-1 no-underline hover:no-underline rounded justify-center leading-none transition-colors ease-in-out group",{"button--primary p-4":e.variant==="primary","button--secondary p-4":e.variant==="secondary","button--tertiary":e.variant==="tertiary"}]},a.$attrs,{to:e.to,href:e.href}),{default:M(()=>[xe(a.$slots,"default")]),_:3},16,["class","to","href"]))}});const ut={},it={xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24","stroke-width":"1.5",stroke:"currentColor",class:"w-5 h-5"},ct=y("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"},null,-1),ft=[ct];function dt(e,t){return P(),k("svg",it,ft)}const pt=J(ut,[["render",dt]]),vt=$({__name:"AppMenuButton",setup(e){return(t,n)=>(P(),W($e,{class:"app-menu-button rounded-full p-2",variant:"primary"},{default:M(()=>[S(pt)]),_:1}))}});function K(e,t,...n){if(e in t){let r=t[e];return typeof r=="function"?r(...n):r}let a=new Error(`Tried to handle "${e}" but there is no handler defined. Only defined handlers are: ${Object.keys(t).map(r=>`"${r}"`).join(", ")}.`);throw Error.captureStackTrace&&Error.captureStackTrace(a,K),a}var ee=(e=>(e[e.None=0]="None",e[e.RenderStrategy=1]="RenderStrategy",e[e.Static=2]="Static",e))(ee||{}),mt=(e=>(e[e.Unmount=0]="Unmount",e[e.Hidden=1]="Hidden",e))(mt||{});function Z({visible:e=!0,features:t=0,ourProps:n,theirProps:a,...r}){var s;let o=ht(a,n),l=Object.assign(r,{props:o});if(e||t&2&&o.static)return G(l);if(t&1){let i=(s=o.unmount)==null||s?0:1;return K(i,{[0](){return null},[1](){return G({...r,props:{...o,hidden:!0,style:{display:"none"}}})}})}return G(l)}function G({props:e,attrs:t,slots:n,slot:a,name:r}){var s;let{as:o,...l}=bt(e,["unmount","static"]),i=(s=n.default)==null?void 0:s.call(n,a),p={};if(a){let c=!1,u=[];for(let[f,d]of Object.entries(a))typeof d=="boolean"&&(c=!0),d===!0&&u.push(f);c&&(p["data-headlessui-state"]=u.join(" "))}if(o==="template"){if(i=Te(i!=null?i:[]),Object.keys(l).length>0||Object.keys(t).length>0){let[c,...u]=i!=null?i:[];if(!gt(c)||u.length>0)throw new Error(['Passing props on "template"!',"",`The current component <${r} /> is rendering a "template".`,"However we need to passthrough the following props:",Object.keys(l).concat(Object.keys(t)).sort((f,d)=>f.localeCompare(d)).map(f=>`  - ${f}`).join(`
`),"","You can apply a few solutions:",['Add an `as="..."` prop, to ensure that we render an actual element instead of a "template".',"Render a single element as the child so that we can forward the props onto that element."].map(f=>`  - ${f}`).join(`
`)].join(`
`));return qe(c,Object.assign({},l,p))}return Array.isArray(i)&&i.length===1?i[0]:i}return Ge(o,Object.assign({},l,p),{default:()=>i})}function Te(e){return e.flatMap(t=>t.type===Se?Te(t.children):[t])}function ht(...e){if(e.length===0)return{};if(e.length===1)return e[0];let t={},n={};for(let a of e)for(let r in a)r.startsWith("on")&&typeof a[r]=="function"?(n[r]!=null||(n[r]=[]),n[r].push(a[r])):t[r]=a[r];if(t.disabled||t["aria-disabled"])return Object.assign(t,Object.fromEntries(Object.keys(n).map(a=>[a,void 0])));for(let a in n)Object.assign(t,{[a](r,...s){let o=n[a];for(let l of o){if(r instanceof Event&&r.defaultPrevented)return;l(r,...s)}}});return t}function bt(e,t=[]){let n=Object.assign({},e);for(let a of t)a in n&&delete n[a];return n}function gt(e){return e==null?!1:typeof e.type=="string"||typeof e.type=="object"||typeof e.type=="function"}let _t=0;function yt(){return++_t}function le(){return yt()}var _=(e=>(e.Space=" ",e.Enter="Enter",e.Escape="Escape",e.Backspace="Backspace",e.Delete="Delete",e.ArrowLeft="ArrowLeft",e.ArrowUp="ArrowUp",e.ArrowRight="ArrowRight",e.ArrowDown="ArrowDown",e.Home="Home",e.End="End",e.PageUp="PageUp",e.PageDown="PageDown",e.Tab="Tab",e))(_||{});function wt(e){throw new Error("Unexpected object: "+e)}var w=(e=>(e[e.First=0]="First",e[e.Previous=1]="Previous",e[e.Next=2]="Next",e[e.Last=3]="Last",e[e.Specific=4]="Specific",e[e.Nothing=5]="Nothing",e))(w||{});function Ot(e,t){let n=t.resolveItems();if(n.length<=0)return null;let a=t.resolveActiveIndex(),r=a!=null?a:-1,s=(()=>{switch(e.focus){case 0:return n.findIndex(o=>!t.resolveDisabled(o));case 1:{let o=n.slice().reverse().findIndex((l,i,p)=>r!==-1&&p.length-i-1>=r?!1:!t.resolveDisabled(l));return o===-1?o:n.length-1-o}case 2:return n.findIndex((o,l)=>l<=r?!1:!t.resolveDisabled(o));case 3:{let o=n.slice().reverse().findIndex(l=>!t.resolveDisabled(l));return o===-1?o:n.length-1-o}case 4:return n.findIndex(o=>t.resolveId(o)===e.id);case 5:return null;default:wt(e)}})();return s===-1?a:s}function h(e){var t;return e==null||e.value==null?null:(t=e.value.$el)!=null?t:e.value}let Me=Symbol("Context");var Q=(e=>(e[e.Open=0]="Open",e[e.Closed=1]="Closed",e))(Q||{});function It(){return Pe(Me,null)}function xt(e){Ee(Me,e)}function de(e,t){if(e)return e;let n=t!=null?t:"button";if(typeof n=="string"&&n.toLowerCase()==="button")return"button"}function St(e,t){let n=b(de(e.value.type,e.value.as));return U(()=>{n.value=de(e.value.type,e.value.as)}),H(()=>{var a;n.value||!h(t)||h(t)instanceof HTMLButtonElement&&!((a=h(t))!=null&&a.hasAttribute("type"))&&(n.value="button")}),n}const je=typeof window>"u"||typeof document>"u";function se(e){if(je)return null;if(e instanceof Node)return e.ownerDocument;if(e!=null&&e.hasOwnProperty("value")){let t=h(e);if(t)return t.ownerDocument}return document}function Pt({container:e,accept:t,walk:n,enabled:a}){H(()=>{let r=e.value;if(!r||a!==void 0&&!a.value)return;let s=se(e);if(!s)return;let o=Object.assign(i=>t(i),{acceptNode:t}),l=s.createTreeWalker(r,NodeFilter.SHOW_ELEMENT,o,!1);for(;l.nextNode();)n(l.currentNode)})}let te=["[contentEditable=true]","[tabindex]","a[href]","area[href]","button:not([disabled])","iframe","input:not([disabled])","select:not([disabled])","textarea:not([disabled])"].map(e=>`${e}:not([tabindex='-1'])`).join(",");var ne=(e=>(e[e.First=1]="First",e[e.Previous=2]="Previous",e[e.Next=4]="Next",e[e.Last=8]="Last",e[e.WrapAround=16]="WrapAround",e[e.NoScroll=32]="NoScroll",e))(ne||{}),Et=(e=>(e[e.Error=0]="Error",e[e.Overflow=1]="Overflow",e[e.Success=2]="Success",e[e.Underflow=3]="Underflow",e))(Et||{}),$t=(e=>(e[e.Previous=-1]="Previous",e[e.Next=1]="Next",e))($t||{});function Ae(e=document.body){return e==null?[]:Array.from(e.querySelectorAll(te))}var ue=(e=>(e[e.Strict=0]="Strict",e[e.Loose=1]="Loose",e))(ue||{});function ie(e,t=0){var n;return e===((n=se(e))==null?void 0:n.body)?!1:K(t,{[0](){return e.matches(te)},[1](){let a=e;for(;a!==null;){if(a.matches(te))return!0;a=a.parentElement}return!1}})}function De(e){let t=se(e);j(()=>{t&&!ie(t.activeElement,0)&&Tt(e)})}function Tt(e){e==null||e.focus({preventScroll:!0})}let Mt=["textarea","input"].join(",");function jt(e){var t,n;return(n=(t=e==null?void 0:e.matches)==null?void 0:t.call(e,Mt))!=null?n:!1}function Ne(e,t=n=>n){return e.slice().sort((n,a)=>{let r=t(n),s=t(a);if(r===null||s===null)return 0;let o=r.compareDocumentPosition(s);return o&Node.DOCUMENT_POSITION_FOLLOWING?-1:o&Node.DOCUMENT_POSITION_PRECEDING?1:0})}function At(e,t){return Dt(Ae(),t,!0,e)}function Dt(e,t,n=!0,a=null){var r;let s=(r=Array.isArray(e)?e.length>0?e[0].ownerDocument:document:e==null?void 0:e.ownerDocument)!=null?r:document,o=Array.isArray(e)?n?Ne(e):e:Ae(e);a=a!=null?a:s.activeElement;let l=(()=>{if(t&5)return 1;if(t&10)return-1;throw new Error("Missing Focus.First, Focus.Previous, Focus.Next or Focus.Last")})(),i=(()=>{if(t&1)return 0;if(t&2)return Math.max(0,o.indexOf(a))-1;if(t&4)return Math.max(0,o.indexOf(a))+1;if(t&8)return o.length-1;throw new Error("Missing Focus.First, Focus.Previous, Focus.Next or Focus.Last")})(),p=t&32?{preventScroll:!0}:{},c=0,u=o.length,f;do{if(c>=u||c+u<=0)return 0;let d=i+c;if(t&16)d=(d+u)%u;else{if(d<0)return 3;if(d>=u)return 1}f=o[d],f==null||f.focus(p),c+=l}while(f!==s.activeElement);return t&6&&jt(f)&&f.select(),f.hasAttribute("tabindex")||f.setAttribute("tabindex","0"),2}function Y(e,t,n){je||H(a=>{document.addEventListener(e,t,n),a(()=>document.removeEventListener(e,t,n))})}function Nt(e,t,n=O(()=>!0)){function a(s,o){if(!n.value||s.defaultPrevented)return;let l=o(s);if(l===null||!l.getRootNode().contains(l))return;let i=function p(c){return typeof c=="function"?p(c()):Array.isArray(c)||c instanceof Set?c:[c]}(e);for(let p of i){if(p===null)continue;let c=p instanceof HTMLElement?p:h(p);if(c!=null&&c.contains(l))return}return!ie(l,ue.Loose)&&l.tabIndex!==-1&&s.preventDefault(),t(s,l)}let r=b(null);Y("mousedown",s=>{var o,l;n.value&&(r.value=((l=(o=s.composedPath)==null?void 0:o.call(s))==null?void 0:l[0])||s.target)},!0),Y("click",s=>{!r.value||(a(s,()=>r.value),r.value=null)},!0),Y("blur",s=>a(s,()=>window.document.activeElement instanceof HTMLIFrameElement?window.document.activeElement:null),!0)}var Rt=(e=>(e[e.Open=0]="Open",e[e.Closed=1]="Closed",e))(Rt||{}),kt=(e=>(e[e.Pointer=0]="Pointer",e[e.Other=1]="Other",e))(kt||{});function Ct(e){requestAnimationFrame(()=>requestAnimationFrame(e))}let Re=Symbol("MenuContext");function q(e){let t=Pe(Re,null);if(t===null){let n=new Error(`<${e} /> is missing a parent <Menu /> component.`);throw Error.captureStackTrace&&Error.captureStackTrace(n,q),n}return t}let Lt=$({name:"Menu",props:{as:{type:[Object,String],default:"template"}},setup(e,{slots:t,attrs:n}){let a=b(1),r=b(null),s=b(null),o=b([]),l=b(""),i=b(null),p=b(1);function c(f=d=>d){let d=i.value!==null?o.value[i.value]:null,v=Ne(f(o.value.slice()),I=>h(I.dataRef.domRef)),m=d?v.indexOf(d):null;return m===-1&&(m=null),{items:v,activeItemIndex:m}}let u={menuState:a,buttonRef:r,itemsRef:s,items:o,searchQuery:l,activeItemIndex:i,activationTrigger:p,closeMenu:()=>{a.value=1,i.value=null},openMenu:()=>a.value=0,goToItem(f,d,v){let m=c(),I=Ot(f===w.Specific?{focus:w.Specific,id:d}:{focus:f},{resolveItems:()=>m.items,resolveActiveIndex:()=>m.activeItemIndex,resolveId:T=>T.id,resolveDisabled:T=>T.dataRef.disabled});l.value="",i.value=I,p.value=v!=null?v:1,o.value=m.items},search(f){let d=l.value!==""?0:1;l.value+=f.toLowerCase();let v=(i.value!==null?o.value.slice(i.value+d).concat(o.value.slice(0,i.value+d)):o.value).find(I=>I.dataRef.textValue.startsWith(l.value)&&!I.dataRef.disabled),m=v?o.value.indexOf(v):-1;m===-1||m===i.value||(i.value=m,p.value=1)},clearSearch(){l.value=""},registerItem(f,d){let v=c(m=>[...m,{id:f,dataRef:d}]);o.value=v.items,i.value=v.activeItemIndex,p.value=1},unregisterItem(f){let d=c(v=>{let m=v.findIndex(I=>I.id===f);return m!==-1&&v.splice(m,1),v});o.value=d.items,i.value=d.activeItemIndex,p.value=1}};return Nt([r,s],(f,d)=>{var v;u.closeMenu(),ie(d,ue.Loose)||(f.preventDefault(),(v=h(r))==null||v.focus())},O(()=>a.value===0)),Ee(Re,u),xt(O(()=>K(a.value,{[0]:Q.Open,[1]:Q.Closed}))),()=>{let f={open:a.value===0,close:u.closeMenu};return Z({ourProps:{},theirProps:e,slot:f,slots:t,attrs:n,name:"Menu"})}}}),Ft=$({name:"MenuButton",props:{disabled:{type:Boolean,default:!1},as:{type:[Object,String],default:"button"}},setup(e,{attrs:t,slots:n,expose:a}){let r=q("MenuButton"),s=`headlessui-menu-button-${le()}`;a({el:r.buttonRef,$el:r.buttonRef});function o(c){switch(c.key){case _.Space:case _.Enter:case _.ArrowDown:c.preventDefault(),c.stopPropagation(),r.openMenu(),j(()=>{var u;(u=h(r.itemsRef))==null||u.focus({preventScroll:!0}),r.goToItem(w.First)});break;case _.ArrowUp:c.preventDefault(),c.stopPropagation(),r.openMenu(),j(()=>{var u;(u=h(r.itemsRef))==null||u.focus({preventScroll:!0}),r.goToItem(w.Last)});break}}function l(c){switch(c.key){case _.Space:c.preventDefault();break}}function i(c){e.disabled||(r.menuState.value===0?(r.closeMenu(),j(()=>{var u;return(u=h(r.buttonRef))==null?void 0:u.focus({preventScroll:!0})})):(c.preventDefault(),r.openMenu(),Ct(()=>{var u;return(u=h(r.itemsRef))==null?void 0:u.focus({preventScroll:!0})})))}let p=St(O(()=>({as:e.as,type:t.type})),r.buttonRef);return()=>{var c;let u={open:r.menuState.value===0},f={ref:r.buttonRef,id:s,type:p.value,"aria-haspopup":!0,"aria-controls":(c=h(r.itemsRef))==null?void 0:c.id,"aria-expanded":e.disabled?void 0:r.menuState.value===0,onKeydown:o,onKeyup:l,onClick:i};return Z({ourProps:f,theirProps:e,slot:u,attrs:t,slots:n,name:"MenuButton"})}}}),Ht=$({name:"MenuItems",props:{as:{type:[Object,String],default:"div"},static:{type:Boolean,default:!1},unmount:{type:Boolean,default:!0}},setup(e,{attrs:t,slots:n,expose:a}){let r=q("MenuItems"),s=`headlessui-menu-items-${le()}`,o=b(null);a({el:r.itemsRef,$el:r.itemsRef}),Pt({container:O(()=>h(r.itemsRef)),enabled:O(()=>r.menuState.value===0),accept(u){return u.getAttribute("role")==="menuitem"?NodeFilter.FILTER_REJECT:u.hasAttribute("role")?NodeFilter.FILTER_SKIP:NodeFilter.FILTER_ACCEPT},walk(u){u.setAttribute("role","none")}});function l(u){var f;switch(o.value&&clearTimeout(o.value),u.key){case _.Space:if(r.searchQuery.value!=="")return u.preventDefault(),u.stopPropagation(),r.search(u.key);case _.Enter:if(u.preventDefault(),u.stopPropagation(),r.activeItemIndex.value!==null){let d=r.items.value[r.activeItemIndex.value];(f=h(d.dataRef.domRef))==null||f.click()}r.closeMenu(),De(h(r.buttonRef));break;case _.ArrowDown:return u.preventDefault(),u.stopPropagation(),r.goToItem(w.Next);case _.ArrowUp:return u.preventDefault(),u.stopPropagation(),r.goToItem(w.Previous);case _.Home:case _.PageUp:return u.preventDefault(),u.stopPropagation(),r.goToItem(w.First);case _.End:case _.PageDown:return u.preventDefault(),u.stopPropagation(),r.goToItem(w.Last);case _.Escape:u.preventDefault(),u.stopPropagation(),r.closeMenu(),j(()=>{var d;return(d=h(r.buttonRef))==null?void 0:d.focus({preventScroll:!0})});break;case _.Tab:u.preventDefault(),u.stopPropagation(),r.closeMenu(),j(()=>At(h(r.buttonRef),u.shiftKey?ne.Previous:ne.Next));break;default:u.key.length===1&&(r.search(u.key),o.value=setTimeout(()=>r.clearSearch(),350));break}}function i(u){switch(u.key){case _.Space:u.preventDefault();break}}let p=It(),c=O(()=>p!==null?p.value===Q.Open:r.menuState.value===0);return()=>{var u,f;let d={open:r.menuState.value===0},v={"aria-activedescendant":r.activeItemIndex.value===null||(u=r.items.value[r.activeItemIndex.value])==null?void 0:u.id,"aria-labelledby":(f=h(r.buttonRef))==null?void 0:f.id,id:s,onKeydown:l,onKeyup:i,role:"menu",tabIndex:0,ref:r.itemsRef};return Z({ourProps:v,theirProps:e,slot:d,attrs:t,slots:n,features:ee.RenderStrategy|ee.Static,visible:c.value,name:"MenuItems"})}}}),Vt=$({name:"MenuItem",props:{as:{type:[Object,String],default:"template"},disabled:{type:Boolean,default:!1}},setup(e,{slots:t,attrs:n,expose:a}){let r=q("MenuItem"),s=`headlessui-menu-item-${le()}`,o=b(null);a({el:o,$el:o});let l=O(()=>r.activeItemIndex.value!==null?r.items.value[r.activeItemIndex.value].id===s:!1),i=O(()=>({disabled:e.disabled,textValue:"",domRef:o}));U(()=>{var d,v;let m=(v=(d=h(o))==null?void 0:d.textContent)==null?void 0:v.toLowerCase().trim();m!==void 0&&(i.value.textValue=m)}),U(()=>r.registerItem(s,i)),Ye(()=>r.unregisterItem(s)),H(()=>{r.menuState.value===0&&(!l.value||r.activationTrigger.value!==0&&j(()=>{var d,v;return(v=(d=h(o))==null?void 0:d.scrollIntoView)==null?void 0:v.call(d,{block:"nearest"})}))});function p(d){if(e.disabled)return d.preventDefault();r.closeMenu(),De(h(r.buttonRef))}function c(){if(e.disabled)return r.goToItem(w.Nothing);r.goToItem(w.Specific,s)}function u(){e.disabled||l.value||r.goToItem(w.Specific,s,0)}function f(){e.disabled||!l.value||r.goToItem(w.Nothing)}return()=>{let{disabled:d}=e,v={active:l.value,disabled:d,close:r.closeMenu};return Z({ourProps:{id:s,ref:o,role:"menuitem",tabIndex:d===!0?void 0:-1,"aria-disabled":d===!0?!0:void 0,onClick:p,onFocus:c,onPointermove:u,onMousemove:u,onPointerleave:f,onMouseleave:f},theirProps:e,slot:v,attrs:n,slots:t,name:"MenuItem"})}}});const Bt={},Wt={xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24","stroke-width":"1.5",stroke:"currentColor",class:"w-5 h-5"},Ut=y("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M19.5 8.25l-7.5 7.5-7.5-7.5"},null,-1),Qt=[Ut];function zt(e,t){return P(),k("svg",Wt,Qt)}const Jt=J(Bt,[["render",zt]]);var pe;const C=typeof window<"u",re=e=>typeof e=="function",ke=e=>typeof e=="string",N=()=>{};C&&((pe=window==null?void 0:window.navigator)==null?void 0:pe.userAgent)&&/iP(ad|hone|od)/.test(window.navigator.userAgent);function R(e){return typeof e=="function"?e():x(e)}function Ce(e,t){function n(...a){e(()=>t.apply(this,a),{fn:t,thisArg:this,args:a})}return n}const Le=e=>e();function Kt(e,t={}){let n,a;return s=>{const o=R(e),l=R(t.maxWait);if(n&&clearTimeout(n),o<=0||l!==void 0&&l<=0)return a&&(clearTimeout(a),a=null),s();l&&!a&&(a=setTimeout(()=>{n&&clearTimeout(n),a=null,s()},l)),n=setTimeout(()=>{a&&clearTimeout(a),a=null,s()},o)}}function Zt(e=Le){const t=b(!0);function n(){t.value=!1}function a(){t.value=!0}return{isActive:t,pause:n,resume:a,eventFilter:(...s)=>{t.value&&e(...s)}}}function qt(e){return e}function L(e){return Xe()?(et(e),!0):!1}function tr(e,t=200,n={}){return Ce(Kt(t,n),e)}function Fe(e){return typeof e=="function"?O(e):b(e)}function Gt(e,t=!0){tt()?U(e):t?e():j(e)}function Yt(e,t,n={}){const{immediate:a=!0}=n,r=b(!1);let s=null;function o(){s&&(clearTimeout(s),s=null)}function l(){r.value=!1,o()}function i(...p){o(),r.value=!0,s=setTimeout(()=>{r.value=!1,s=null,e(...p)},R(t))}return a&&(r.value=!0,C&&i()),L(l),{isPending:r,start:i,stop:l}}var ve=Object.getOwnPropertySymbols,Xt=Object.prototype.hasOwnProperty,en=Object.prototype.propertyIsEnumerable,tn=(e,t)=>{var n={};for(var a in e)Xt.call(e,a)&&t.indexOf(a)<0&&(n[a]=e[a]);if(e!=null&&ve)for(var a of ve(e))t.indexOf(a)<0&&en.call(e,a)&&(n[a]=e[a]);return n};function nn(e,t,n={}){const a=n,{eventFilter:r=Le}=a,s=tn(a,["eventFilter"]);return D(e,Ce(r,t),s)}var rn=Object.defineProperty,an=Object.defineProperties,on=Object.getOwnPropertyDescriptors,z=Object.getOwnPropertySymbols,He=Object.prototype.hasOwnProperty,Ve=Object.prototype.propertyIsEnumerable,me=(e,t,n)=>t in e?rn(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,ln=(e,t)=>{for(var n in t||(t={}))He.call(t,n)&&me(e,n,t[n]);if(z)for(var n of z(t))Ve.call(t,n)&&me(e,n,t[n]);return e},sn=(e,t)=>an(e,on(t)),un=(e,t)=>{var n={};for(var a in e)He.call(e,a)&&t.indexOf(a)<0&&(n[a]=e[a]);if(e!=null&&z)for(var a of z(e))t.indexOf(a)<0&&Ve.call(e,a)&&(n[a]=e[a]);return n};function cn(e,t,n={}){const a=n,{eventFilter:r}=a,s=un(a,["eventFilter"]),{eventFilter:o,pause:l,resume:i,isActive:p}=Zt(r);return{stop:nn(e,t,sn(ln({},s),{eventFilter:o})),pause:l,resume:i,isActive:p}}function F(e){var t;const n=R(e);return(t=n==null?void 0:n.$el)!=null?t:n}const A=C?window:void 0,fn=C?window.document:void 0,dn=C?window.navigator:void 0;C&&window.location;function Be(...e){let t,n,a,r;if(ke(e[0])?([n,a,r]=e,t=A):[t,n,a,r]=e,!t)return N;let s=N;const o=D(()=>F(t),i=>{s(),i&&(i.addEventListener(n,a,r),s=()=>{i.removeEventListener(n,a,r),s=N})},{immediate:!0,flush:"post"}),l=()=>{o(),s()};return L(l),l}function V(e,t=!1){const n=b(),a=()=>n.value=Boolean(e());return a(),Gt(a,t),n}function pn(e,t={}){const{window:n=A}=t,a=V(()=>n&&"matchMedia"in n&&typeof n.matchMedia=="function");let r;const s=b(!1),o=()=>{!r||("removeEventListener"in r?r.removeEventListener("change",l):r.removeListener(l))},l=()=>{!a.value||(o(),r=n.matchMedia(Fe(e).value),s.value=r.matches,"addEventListener"in r?r.addEventListener("change",l):r.addListener(l))};return H(l),L(()=>o()),s}function nr(e={}){const{navigator:t=dn,read:n=!1,source:a,copiedDuring:r=1500}=e,s=["copy","cut"],o=V(()=>t&&"clipboard"in t),l=b(""),i=b(!1),p=Yt(()=>i.value=!1,r);function c(){t.clipboard.readText().then(f=>{l.value=f})}if(o.value&&n)for(const f of s)Be(f,c);async function u(f=R(a)){o.value&&f!=null&&(await t.clipboard.writeText(f),l.value=f,i.value=!0,p.start())}return{isSupported:o,text:l,copied:i,copy:u}}const ae=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{},oe="__vueuse_ssr_handlers__";ae[oe]=ae[oe]||{};const vn=ae[oe];function mn(e,t){return vn[e]||t}function hn(e){return e==null?"any":e instanceof Set?"set":e instanceof Map?"map":e instanceof Date?"date":typeof e=="boolean"?"boolean":typeof e=="string"?"string":typeof e=="object"||Array.isArray(e)?"object":Number.isNaN(e)?"any":"number"}var bn=Object.defineProperty,he=Object.getOwnPropertySymbols,gn=Object.prototype.hasOwnProperty,_n=Object.prototype.propertyIsEnumerable,be=(e,t,n)=>t in e?bn(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,ge=(e,t)=>{for(var n in t||(t={}))gn.call(t,n)&&be(e,n,t[n]);if(he)for(var n of he(t))_n.call(t,n)&&be(e,n,t[n]);return e};const yn={boolean:{read:e=>e==="true",write:e=>String(e)},object:{read:e=>JSON.parse(e),write:e=>JSON.stringify(e)},number:{read:e=>Number.parseFloat(e),write:e=>String(e)},any:{read:e=>e,write:e=>String(e)},string:{read:e=>e,write:e=>String(e)},map:{read:e=>new Map(JSON.parse(e)),write:e=>JSON.stringify(Array.from(e.entries()))},set:{read:e=>new Set(JSON.parse(e)),write:e=>JSON.stringify(Array.from(e))},date:{read:e=>new Date(e),write:e=>e.toISOString()}};function wn(e,t,n,a={}){var r;const{flush:s="pre",deep:o=!0,listenToStorageChanges:l=!0,writeDefaults:i=!0,mergeDefaults:p=!1,shallow:c,window:u=A,eventFilter:f,onError:d=g=>{console.error(g)}}=a,v=(c?nt:b)(t);if(!n)try{n=mn("getDefaultStorage",()=>{var g;return(g=A)==null?void 0:g.localStorage})()}catch(g){d(g)}if(!n)return v;const m=R(t),I=hn(m),T=(r=a.serializer)!=null?r:yn[I],{pause:We,resume:Ue}=cn(v,()=>Qe(v.value),{flush:s,deep:o,eventFilter:f});return u&&l&&Be(u,"storage",ce),ce(),v;function Qe(g){try{g==null?n.removeItem(e):n.setItem(e,T.write(g))}catch(E){d(E)}}function ze(g){if(!(g&&g.key!==e)){We();try{const E=g?g.newValue:n.getItem(e);if(E==null)return i&&m!==null&&n.setItem(e,T.write(m)),m;if(!g&&p){const B=T.read(E);return re(p)?p(B,m):I==="object"&&!Array.isArray(B)?ge(ge({},m),B):B}else return typeof E!="string"?E:T.read(E)}catch(E){d(E)}finally{Ue()}}}function ce(g){g&&g.key!==e||(v.value=ze(g))}}function On(e){return pn("(prefers-color-scheme: dark)",e)}var _e=Object.getOwnPropertySymbols,In=Object.prototype.hasOwnProperty,xn=Object.prototype.propertyIsEnumerable,Sn=(e,t)=>{var n={};for(var a in e)In.call(e,a)&&t.indexOf(a)<0&&(n[a]=e[a]);if(e!=null&&_e)for(var a of _e(e))t.indexOf(a)<0&&xn.call(e,a)&&(n[a]=e[a]);return n};function rr(e,t,n={}){const a=n,{window:r=A}=a,s=Sn(a,["window"]);let o;const l=V(()=>r&&"ResizeObserver"in r),i=()=>{o&&(o.disconnect(),o=void 0)},p=D(()=>F(e),u=>{i(),l.value&&r&&u&&(o=new ResizeObserver(t),o.observe(u,s))},{immediate:!0,flush:"post"}),c=()=>{i(),p()};return L(c),{isSupported:l,stop:c}}function ar(e,t,n={}){const{root:a,rootMargin:r="0px",threshold:s=.1,window:o=A}=n,l=V(()=>o&&"IntersectionObserver"in o);let i=N;const p=l.value?D(()=>({el:F(e),root:F(a)}),({el:u,root:f})=>{if(i(),!u)return;const d=new IntersectionObserver(t,{root:f,rootMargin:r,threshold:s});d.observe(u),i=()=>{d.disconnect(),i=N}},{immediate:!0,flush:"post"}):N,c=()=>{i(),p()};return L(c),{isSupported:l,stop:c}}var ye=Object.getOwnPropertySymbols,Pn=Object.prototype.hasOwnProperty,En=Object.prototype.propertyIsEnumerable,$n=(e,t)=>{var n={};for(var a in e)Pn.call(e,a)&&t.indexOf(a)<0&&(n[a]=e[a]);if(e!=null&&ye)for(var a of ye(e))t.indexOf(a)<0&&En.call(e,a)&&(n[a]=e[a]);return n};function Tn(e,t,n={}){const a=n,{window:r=A}=a,s=$n(a,["window"]);let o;const l=V(()=>r&&"MutationObserver"in r),i=()=>{o&&(o.disconnect(),o=void 0)},p=D(()=>F(e),u=>{i(),l.value&&r&&u&&(o=new MutationObserver(t),o.observe(u,s))},{immediate:!0}),c=()=>{i(),p()};return L(c),{isSupported:l,stop:c}}var we;(function(e){e.UP="UP",e.RIGHT="RIGHT",e.DOWN="DOWN",e.LEFT="LEFT",e.NONE="NONE"})(we||(we={}));function or(e=null,t={}){var n,a;const{document:r=fn,observe:s=!1,titleTemplate:o="%s"}=t,l=Fe((n=e!=null?e:r==null?void 0:r.title)!=null?n:null),i=e&&re(e);function p(c){return re(o)?o(c):x(o).replace("%s",c)}return D(l,(c,u)=>{ke(c)&&c!==u&&r&&(r.title=p(c))},{immediate:!0}),s&&r&&!i&&Tn((a=r.head)==null?void 0:a.querySelector("title"),()=>{r&&r.title!==l.value&&(l.value=p(r.title))},{childList:!0}),l}var Mn=Object.defineProperty,Oe=Object.getOwnPropertySymbols,jn=Object.prototype.hasOwnProperty,An=Object.prototype.propertyIsEnumerable,Ie=(e,t,n)=>t in e?Mn(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,Dn=(e,t)=>{for(var n in t||(t={}))jn.call(t,n)&&Ie(e,n,t[n]);if(Oe)for(var n of Oe(t))An.call(t,n)&&Ie(e,n,t[n]);return e};const Nn={easeInSine:[.12,0,.39,0],easeOutSine:[.61,1,.88,1],easeInOutSine:[.37,0,.63,1],easeInQuad:[.11,0,.5,0],easeOutQuad:[.5,1,.89,1],easeInOutQuad:[.45,0,.55,1],easeInCubic:[.32,0,.67,0],easeOutCubic:[.33,1,.68,1],easeInOutCubic:[.65,0,.35,1],easeInQuart:[.5,0,.75,0],easeOutQuart:[.25,1,.5,1],easeInOutQuart:[.76,0,.24,1],easeInQuint:[.64,0,.78,0],easeOutQuint:[.22,1,.36,1],easeInOutQuint:[.83,0,.17,1],easeInExpo:[.7,0,.84,0],easeOutExpo:[.16,1,.3,1],easeInOutExpo:[.87,0,.13,1],easeInCirc:[.55,0,1,.45],easeOutCirc:[0,.55,.45,1],easeInOutCirc:[.85,0,.15,1],easeInBack:[.36,0,.66,-.56],easeOutBack:[.34,1.56,.64,1],easeInOutBack:[.68,-.6,.32,1.6]};Dn({linear:qt},Nn);const Rn=(e={})=>{var o;const t=b([{id:"auto",name:"Auto"},{id:"light",name:"Light"},{id:"dark",name:"Dark"},...(o=e.themes)!=null?o:[]]),n=wn("theme",e.defaultTheme||"auto");function a(l){return t.value.some(i=>i.id===l)}const r=On();function s(){const l=n.value;if(!a(l))throw new Error(`Invalid theme id: ${l}`);if(l==="auto"){document.documentElement.setAttribute("data-theme",r.value?"dark":"light");return}document.documentElement.setAttribute("data-theme",l)}return D([n,r],s,{immediate:!0}),{availableThemes:t,activeThemeId:n}},kn=y("h2",{class:"text-xs uppercase font-medium"},"Theme",-1),Cn={class:"py-1"},Ln=["onClick"],Fn=$({__name:"ThemeSelector",setup(e){const{activeThemeId:t,availableThemes:n}=Rn({themes:[{id:"hotdog",name:"Hot Dog"}]}),a=O(()=>{const s=n.value.find(o=>o.id===t.value);return s==null?void 0:s.name});function r(s){t.value=s}return(s,o)=>(P(),W(x(Lt),{as:"div",class:"relative inline-block text-left"},{default:M(()=>[y("div",null,[S(x(Ft),{class:"inline-flex w-full justify-center items-center rounded-md gap-2 px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100"},{default:M(()=>{var l;return[kn,y("span",null,X((l=x(a))!=null?l:"-"),1),S(Jt,{class:"-mr-1 ml-2 h-5 w-5","aria-hidden":"true"})]}),_:1})]),S(at,{enterActiveClass:"transition ease-out duration-100",enterFromClass:"transform opacity-0 scale-95",enterToClass:"transform opacity-100 scale-100",leaveActiveClass:"transition ease-in duration-75",leaveFromClass:"transform opacity-100 scale-100",leaveToClass:"transform opacity-0 scale-95"},{default:M(()=>[S(x(Ht),{class:"absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"},{default:M(()=>[y("div",Cn,[(P(!0),k(Se,null,rt(x(n),l=>(P(),W(x(Vt),{key:l.id},{default:M(({active:i})=>[y("button",{class:ot([i?"bg-gray-100 text-gray-900":"text-gray-700","block px-4 py-2 text-sm w-full text-left"]),onClick:p=>r(l.id)},X(l.name),11,Ln)]),_:2},1024))),128))])]),_:1})]),_:1})]),_:1}))}}),Hn={},Vn={width:"9",height:"31",viewBox:"0 0 9 31",fill:"none",xmlns:"http://www.w3.org/2000/svg"},Bn=y("path",{d:"M8.96268 2.86638L6.49786 0.5L4.03304 2.90298V8.47338L0 12.2597V30.5H8.96275V12.2597L9 8.43678L8.96268 2.86638ZM3.80904 26.4223H1.9418V23.182H3.80904V26.4223ZM3.80904 16.8834H1.9418V13.6431H3.80904V16.8834ZM7.24496 21.5799H5.37772V18.3396H7.24496V21.5799ZM7.24496 16.8834H5.37772V13.6431H7.24496V16.8834ZM5.639 5.85182V3.99509L6.46058 3.19412L7.28217 3.99509V5.88836L5.63893 5.88811L5.639 5.85182Z",fill:"currentColor"},null,-1),Wn=[Bn];function Un(e,t){return P(),k("svg",Vn,Wn)}const Qn=J(Hn,[["render",Un]]),zn={class:"app-header flex justify-between items-center px-4 py-2"},Jn=["href"],Kn={class:"app-header__wordmark font-bold text-xl"},Zn={class:"flex gap-2 items-center"},qn=$({__name:"AppHeader",props:{logoImg:{default:()=>lt},menuItems:{default:()=>st},title:{default:()=>fe.instance.name}},setup(e){return(t,n)=>(P(),k("header",zn,[y("div",null,[y("a",{href:x(fe).instance.base.url,class:"flex items-center gap-4 hover:no-underline"},[S(Qn,{class:"h-full app-header__icon"}),y("h1",Kn,X(e.title),1)],8,Jn)]),y("div",Zn,[S(Fn),S($e,{variant:"primary",class:"app-header__menu-button rounded-full p-2"},{default:M(()=>[S(vt)]),_:1})])]))}});const Gn=J(qn,[["__scopeId","data-v-23e1d98d"]]),Yn={class:"h-screen flex flex-col"},Xn={class:"flex-1"},lr=$({__name:"DefaultLayout",props:{logoImg:null,menuItems:null},setup(e){return(t,n)=>(P(),k("div",Yn,[S(Gn,{logoImg:e.logoImg,menuItems:e.menuItems,class:""},null,8,["logoImg","menuItems"]),y("div",Xn,[xe(t.$slots,"default")])]))}});export{Jt as C,lr as _,rr as a,tr as b,$e as c,nr as d,pn as e,or as f,ar as u};
//# sourceMappingURL=DefaultLayout.vue_vue_type_script_setup_true_lang.js.map
