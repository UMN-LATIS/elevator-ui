import{M as c,m as d,a as i}from"./mapConstants.js";import{d as g,k as f,l as u,z as k,u as s,p as M,o as _,b,h as v}from"./index.js";import"./AssetViewPage.js";import"./DefaultLayout.vue_vue_type_script_setup_true_lang.js";import"./ThumbnailImage.js";const L={class:"map-marker"},x=g({__name:"MapMarker",props:{lng:null,lat:null,color:{default:"#f43f5e"},draggable:{type:Boolean,default:!1}},emits:["drag"],setup(m,{emit:p}){const a=m,n=f(c),e=u(null);return k([n,()=>a],()=>{const r=s(n);if(!r){console.log("Cannot add marker yet. No map.");return}const t=s(e);t&&t.remove(),e.value=new d.exports.Marker({color:a.color,draggable:a.draggable}).setLngLat([a.lng,a.lat]).addTo(r).on("dragend",()=>{var l;const o=(l=e.value)==null?void 0:l.getLngLat();!o||p("drag",{lng:o.lng,lat:o.lat})})},{immediate:!0}),M(i,e),(r,t)=>(_(),b("div",L,[v(r.$slots,"default")]))}});export{x as default};
//# sourceMappingURL=MapMarker.js.map
