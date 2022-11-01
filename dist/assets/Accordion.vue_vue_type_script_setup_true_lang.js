import{a as i,r as p,o as n,j as t,k as o,l as s,t as c,h as _}from"./index.js";const u={class:"accordion overflow-hidden bg-neutral-50 w-full mt-2 rounded border"},f=["label","icon"],b={class:"flex-1 block text-left font-normal"},m={class:"flex place-items-center"},h={class:"material-symbols-outlined"},g={key:0,class:"accordion__panel p-4 pt-6 flex flex-col gap-6 border-t"},k=i({__name:"Accordion",props:{label:{default:"-"}},emits:["toggle","open"],setup(r,{emit:a}){const e=p(!1);function d(){e.value=!e.value,a("toggle"),e.value&&a("open")}return(l,v)=>(n(),t("div",u,[o("button",{class:"accordion__header flex w-full justify-between items-center p-4 gap-2 bg-white border-none rounded-b-none",label:e.value?"close":"open",icon:e.value?"expand_less":"expand_more",onClick:d},[s(l.$slots,"label",{},()=>[o("span",b,c(r.label),1)]),o("div",m,[s(l.$slots,"label-icon",{},()=>[o("span",h,c(e.value?"expand_less":"expand_more"),1)])])],8,f),e.value?(n(),t("div",g,[s(l.$slots,"default")])):_("",!0)]))}});export{k as _};
//# sourceMappingURL=Accordion.vue_vue_type_script_setup_true_lang.js.map
