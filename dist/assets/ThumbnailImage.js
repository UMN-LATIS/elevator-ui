import{u as g}from"./DefaultLayout.vue_vue_type_script_setup_true_lang.js";import{_ as d,o as s,b as o,a as m,d as f,l as c,n as b,m as p,E as h,e as u,c as w,w as y,h as k,C as x,g as C}from"./index.js";const I={},$={xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24","stroke-width":"1.5",stroke:"currentColor",class:"w-5 h-5"},z=m("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"},null,-1),B=[z];function L(e,t){return s(),o("svg",$,B)}const j=d(I,[["render",L]]);function A(e){const{overflowY:t,overflowX:a}=getComputedStyle(e);return!t.includes("hidden")&&!t.includes("visible")&&!a.includes("hidden")&&!a.includes("visible")&&e.scrollHeight>=e.clientHeight}function _(e){return e?A(e)?e:_(e.parentNode):document.body}const M=["src","alt"],V={key:1,class:"absolute inset-0 z-10 flex justify-center items-center bg-neutral-200 border border-neutral-300 text-neutral-400"},H=f({__name:"LazyLoadImage",props:{src:null,alt:null},setup(e){const t=c(null),a=c(!1),l=c(!1);function v(n,r){n.forEach(i=>{i.isIntersecting&&(a.value=!0,r.unobserve(i.target))})}return b(()=>{const n={root:_(t.value),rootMargin:"640px",threshold:0};g(t,v,n)}),(n,r)=>(s(),o("div",{ref_key:"imgContainer",ref:t,class:"lazy-load-image relative w-full h-full min-w-[4rem] min-h-[4rem]"},[a.value?(s(),o("img",p({key:0,class:["lazy-load-image__image block bg-neutral-100 opacity-0 transition-opacity",{"opacity-100":l.value}],src:e.src,alt:e.alt},n.$attrs,{onLoad:r[0]||(r[0]=i=>l.value=!0)}),null,16,M)):h("",!0),l.value?h("",!0):(s(),o("div",V,[u(j)]))],512))}}),N={},S={xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24","stroke-width":"1.5",stroke:"currentColor",class:"w-5 h-5"},T=m("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"},null,-1),E=[T];function O(e,t){return s(),o("svg",S,E)}const P=d(N,[["render",O]]),q={class:"thumbnail-image__icon absolute z-10 bg-transparent-white-500 rounded-full w-12 h-12 flex justify-center items-center backdrop-blur-sm top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-0 group-hover:scale-100 transition-all"},D=f({__name:"ThumbnailImage",props:{src:null,alt:null,href:{default:void 0},isActive:{type:Boolean,default:!1}},setup(e){return(t,a)=>(s(),w(C(e.href?"a":"div"),{href:e.href,class:x(["thumbnail-image block rounded overflow-hidden hover:shadow-md w-24 aspect-square relative border border-transparent-black-200 shadow-sm opacity-75 hover:opacity-100 group transition-all",{"thumbnail-image--is-active ring ring-offset-1 ring-blue-600":e.isActive}])},{default:y(()=>[m("div",q,[u(P,{class:"text-neutral-900"})]),u(H,{src:e.src,alt:e.alt,class:"group-hover:scale-110 w-full h-full object-cover transition-all"},null,8,["src","alt"]),k(t.$slots,"default",{},void 0,!0)]),_:3},8,["href","class"]))}});const Y=d(D,[["__scopeId","data-v-be068a14"]]);export{P as A,j as I,Y as T};
//# sourceMappingURL=ThumbnailImage.js.map
