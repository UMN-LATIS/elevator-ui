import{_ as f}from"./ClickToSearchLink.vue_vue_type_script_setup_true_lang.js";import{_}from"./WidgetList.js";import{a as m,e as p,o as n,f as s,g as d,n as u,t as c,u as o,j as r,F as g,x,m as C}from"./index.js";import"./AssetViewPage.js";import"./DefaultLayout.vue_vue_type_script_setup_true_lang.js";const w=m({__name:"DateWidgetItem",props:{dateContent:null,widget:null},setup(t){const a=t,l=p(()=>{let e="";return e+=a.dateContent.start.text,a.dateContent.range&&(e+=" - "+a.dateContent.end.text),e});return(e,i)=>(n(),s(f,{widget:t.widget,linkText:o(l)},{default:d(()=>[t.dateContent.label?(n(),s(_,{key:0,label:t.dateContent.label,variant:"inline"},{default:d(()=>[u(c(o(l)),1)]),_:1},8,["label"])):(n(),r(g,{key:1},[u(c(o(l)),1)],64))]),_:1},8,["widget","linkText"]))}}),D=m({__name:"DateWidget",props:{widget:null,contents:null},setup(t){return(a,l)=>(n(),r("ul",null,[(n(!0),r(g,null,x(t.contents,(e,i)=>(n(),r("li",{key:i},[C(w,{dateContent:e,widget:t.widget},null,8,["dateContent","widget"])]))),128))]))}});export{D as default};
//# sourceMappingURL=DateWidget.js.map
