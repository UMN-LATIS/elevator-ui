import{d as o,b as a,a as e,u as c,o as n,f as r,e as m,g as u}from"./index.js";const d={src:"https://dev.elevator.umn.edu/assets/instanceAssets/7.png",alt:"Elevator DCL Logo"},i=[{name:"Home",href:"https://dev.elevator.umn.edu"},{name:"About",href:"https://dev.elevator.umn.edu/dcl/page/view/1"},{name:"Collections",children:["Recent Collections",{name:"Weisman Art Museum",href:"https://dcl.elevator.umn.edu/search/s/f6200137-aee5-4a78-bf88-4c6f3689e06a"},{name:"American Studies, Dept. of",href:"https://dcl.elevator.umn.edu/search/s/5a3c5350-0e02-466f-8efb-3cd0b03bdc67"},null,{name:"All Collections",href:"https://dcl.elevator.umn.edu/search/listCollections"}]}],h={class:"bg-umn-gold-light flex justify-between items-center p-4"},f={class:"flex items-center gap-4"},g=["href"],p=e("h1",{class:"h-12"},[e("img",{src:"https://dev.elevator.umn.edu/assets/instanceAssets/7.png",alt:"Elevator Digital Content Library logo",class:"max-h-full"})],-1),_=[p],v=o({__name:"AppHeader",props:{logoImg:{default:()=>d},menuItems:{default:()=>i}},setup(s){return(t,l)=>(n(),a("header",h,[e("div",f,[e("a",{href:c(r).base.url},_,8,g)])]))}}),I={class:"h-screen flex flex-col"},b={class:"flex-1"},A=o({__name:"DefaultLayout",props:{logoImg:null,menuItems:null},setup(s){return(t,l)=>(n(),a("div",I,[m(v,{logoImg:s.logoImg,menuItems:s.menuItems,class:""},null,8,["logoImg","menuItems"]),e("div",b,[u(t.$slots,"default")])]))}});export{A as _};
//# sourceMappingURL=DefaultLayout.vue_vue_type_script_setup_true_lang.js.map