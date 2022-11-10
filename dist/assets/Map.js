import{a as S}from"./DefaultLayout.vue_vue_type_script_setup_true_lang.js";import{m as l,M as h}from"./mapConstants.js";import{d as w,l as i,z as g,n as x,p as M,o as f,b as y,a as p,F as k,r as z,D as $,B as G,h as I,_ as B}from"./index.js";import"./AssetViewPage.js";import"./ThumbnailImage.js";const R=s=>s.addControl(new l.exports.FullscreenControl({container:document.querySelector("body")})).addControl(new l.exports.GeolocateControl({positionOptions:{enableHighAccuracy:!0},trackUserLocation:!0})).addControl(new l.exports.ScaleControl({unit:"imperial"})),A={class:"maplibre-map"},E={class:"flex gap-4 justify-end items-center my-2"},K=["onClick"],U=w({__name:"Map",props:{center:null,zoom:null,apiKey:null,esriSourceUrl:null},emits:["click","load"],setup(s,{emit:u}){const n=s,r=i(null),e=i(null),d={satellite:{label:"Satellite",name:"ArcGIS:Imagery",type:"style"},streets:{label:"Street",name:"ArcGIS:Navigation",type:"style"}},a=i("satellite"),m=t=>{const v="https://basemaps-api.arcgis.com/arcgis/rest/services/styles",{name:c,type:o,url:_}=d[t];return _||`${v}/${c}?type=${o}&token=${n.apiKey}`},b=t=>{a.value=t};function C(){!e.value||e.value.setStyle(m(a.value))}return g(a,C),x(()=>{if(!r.value)throw Error("Cannot create Map: container not defined:");e.value=R(new l.exports.Map({container:r.value,center:n.center?[n.center.lng,n.center.lat]:[0,0],style:m(a.value),zoom:n.zoom})),e.value.on("click",t=>{if(!e.value)throw new Error("there was a click but no map");u("click",t,e.value)}),e.value.on("load",()=>{if(!e.value)throw new Error("cannot emit load event: no mapRef");u("load",e.value)}),S(r,()=>{!e.value||e.value.resize()})}),M(h,e),(t,v)=>(f(),y("div",A,[p("div",E,[(f(),y(k,null,z(d,(c,o)=>p("button",{key:o,class:$(["text-sm uppercase",{"font-bold border-b-2 border-b-neutral-900":o===a.value,"text-neutral-500":o!==a.value}]),onClick:_=>b(o)},G(c.label),11,K)),64))]),p("div",{ref_key:"mapContainerRef",ref:r,class:"map-container"},null,512),I(t.$slots,"default",{},void 0,!0)]))}});const O=B(U,[["__scopeId","data-v-188d9729"]]);export{O as default};
//# sourceMappingURL=Map.js.map
