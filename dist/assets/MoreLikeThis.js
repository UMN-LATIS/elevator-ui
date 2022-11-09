import{g as y,a as p,_ as I,b as $,c as S}from"./AssetViewPage.js";import{I as j}from"./ThumbnailImage.js";import{d as h,o as t,b as r,a as l,c as u,h as A,f as g,w as x,e as b,B as i,u as c,F as v,r as M,G as k,_ as C,l as L,z as T,n as B,M as N}from"./index.js";import"./DefaultLayout.vue_vue_type_script_setup_true_lang.js";const R={class:"border shadow-sm rounded-md overflow-hidden flex flex-col"},V={class:"placeholder-image bg-neutral-300 w-full aspect-video flex justify-center items-center overflow-hidden"},U=["src","alt"],z={class:"p-4 bg-white flex-1"},F=h({__name:"MediaCard",props:{imgSrc:null,imgAlt:null},setup(s){return(e,a)=>(t(),r("article",R,[l("div",V,[s.imgSrc?(t(),r("img",{key:0,src:s.imgSrc,alt:s.imgAlt||"Untitled",loading:"lazy",class:"w-full h-full object-cover"},null,8,U)):(t(),u(j,{key:1}))]),l("div",z,[A(e.$slots,"default")])]))}}),D={class:"h-full pb-16 relative"},E={class:"font-bold text-xl mb-2 text-neutral-900"},G={key:0,class:"grid gap-3"},H={class:"text-xs text-neutral-400 uppercase col-span-1 flex items-start justify-start hyphens"},q={class:"text-sm col-span-2"},J=h({__name:"SearchResultCard",props:{searchMatch:null},setup(s){const e=s,a=g(()=>Array.isArray(e.searchMatch.title)?e.searchMatch.title.join(","):e.searchMatch.title&&e.searchMatch.title.length>0?e.searchMatch.title:"(no title)"),_=g(()=>{const{primaryHandlerId:o}=e.searchMatch;return o?y(o):null});return(o,d)=>(t(),u(F,{imgSrc:c(_),imgAlt:c(a),class:"hover:shadow-lg transition-shadow"},{default:x(()=>{var m;return[l("div",D,[b(I,{to:c(p)(s.searchMatch.objectId)},{default:x(()=>[l("h1",E,i(c(a)),1)]),_:1},8,["to"]),(m=e.searchMatch)!=null&&m.entries?(t(),r("dl",G,[(t(!0),r(v,null,M(e.searchMatch.entries,(n,w)=>{var f;return t(),r("div",{key:w},[l("dt",H,i((n==null?void 0:n.label)||"Item"),1),l("dd",q,i((f=n.entries)==null?void 0:f.join(", ")),1)])}),128))])):k("",!0),b($,{to:c(p)(s.searchMatch.objectId),class:"absolute bottom-0 right-0"},null,8,["to"])])]}),_:1},8,["imgSrc","imgAlt"]))}});const K=C(J,[["__scopeId","data-v-600c8b70"]]),O={key:0,class:"border-t border-neutral-900 mt-6 pt-6"},P={class:"font-bold text-xl text-neutral-900 flex items-center gap-2 flex-wrap mb-4"},Q=N(" More Like This "),W={class:"inline-flex items-center px-2 py-1 rounded-full text-xs font-normal bg-neutral-900 text-neutral-100"},te=h({__name:"MoreLikeThis",props:{assetId:null},setup(s){const e=s,a=L([]);return T(()=>e.assetId,async()=>{a.value=await S.getMoreLikeThis(e.assetId)},{immediate:!0}),B(()=>{console.log("MoreLikeThis mounted")}),(_,o)=>a.value.length?(t(),r("div",O,[l("h3",P,[Q,l("span",W,i(a.value.length),1)]),(t(!0),r(v,null,M(a.value,d=>(t(),u(K,{key:d.objectId,searchMatch:d},null,8,["searchMatch"]))),128))])):k("",!0)}});export{te as default};
//# sourceMappingURL=MoreLikeThis.js.map
