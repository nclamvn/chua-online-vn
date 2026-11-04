const enhanced=new WeakMap();
const destinationIcons={
 temple:'hands',bell:'bell',pond:'lotus',tree:'leaf',oracle:'coins',offerings:'ticket',
 festival:'people',market:'market',tea:'tea',meditation:'breathe',memorial:'lotus',
 gate:'map','seat-hall':'breathe','seat-tree':'breathe'
};
let opened=null;

export function closeGlassMenu(){opened?.close()}
export function refreshGlassSelect(select){enhanced.get(select)?.refresh()}
export function focusGlassSelect(select){(enhanced.get(select)?.trigger||select).focus({preventScroll:true})}

export function mountGlassSelects(root,icon){
 if(!('showPopover' in HTMLElement.prototype))return;
 for(const select of root.querySelectorAll('select[id]:not([multiple])')){
  if(!enhanced.has(select)&&!select.disabled&&select.size<2)mount(select,icon);
 }
}

function mount(select,icon){
 const wrapper=document.createElement('div'),trigger=document.createElement('button');
 const value=document.createElement('span'),arrow=document.createElement('span'),list=document.createElement('div');
 const label=select.getAttribute('aria-label')||select.labels[0]?.textContent.trim()||select.id;
 wrapper.className='glass-select';
 wrapper.dataset.field=select.id;
 trigger.type='button';
 trigger.id=select.id+'-trigger';
 trigger.className='glass-select-trigger';
 trigger.setAttribute('role','combobox');
 trigger.setAttribute('aria-label',label);
 trigger.setAttribute('aria-expanded','false');
 trigger.setAttribute('aria-controls',select.id+'-choices');
 list.id=select.id+'-choices';
 list.className='glass-select-menu';
 list.dataset.field=select.id;
 list.setAttribute('popover','manual');
 list.setAttribute('role','listbox');
 list.setAttribute('aria-label',label);
 value.className='glass-select-value';
 arrow.className='glass-select-arrow';
 arrow.innerHTML=icon('chevron-down');
 trigger.append(value,arrow);
 for(const element of select.labels)element.htmlFor=trigger.id;
 select.before(wrapper);
 wrapper.append(select,trigger,list);
 select.hidden=true;
 select.dataset.glassNative='';

 const choices=[];
 let active=-1,typed='',typedAt=0,open=false;
 function appendOption(option,parent){
  if(!option.value||option.disabled||option.parentElement.disabled)return;
  const row=document.createElement('div'),title=document.createElement('span'),check=document.createElement('span');
  const id=choices.length;
  row.className='glass-select-option';
  row.id=list.id+'-'+id;
  row.setAttribute('role','option');
  row.setAttribute('aria-selected','false');
  if(select.id==='scene-location'){
   const glyph=document.createElement('span');
   glyph.className='glass-select-glyph';
   glyph.innerHTML=icon(destinationIcons[option.value]||'leaf');
   row.append(glyph);
  }
  title.textContent=option.label;
  check.className='glass-select-check';
  check.innerHTML=icon('check');
  row.append(title,check);
  row.addEventListener('click',()=>commit(id));
  row.addEventListener('pointerenter',event=>{
   if(open&&event.pointerType==='mouse')mark(id,false);
  });
  parent.append(row);
  choices.push({row,option});
 }
 for(const child of select.children){
  if(child.tagName!=='OPTGROUP'){appendOption(child,list);continue}
  const group=document.createElement('div'),caption=document.createElement('div');
  group.className='glass-select-group';
  group.setAttribute('role','group');
  group.setAttribute('aria-label',child.label);
  caption.className='glass-select-caption';
  caption.textContent=child.label;
  caption.setAttribute('aria-hidden','true');
  group.append(caption);
  for(const option of child.children)appendOption(option,group);
  list.append(group);
 }
 function refresh(){
  value.textContent=select.selectedOptions[0]?.label||'';
  const selected=select.value||select.dataset.current;
  for(const {row,option} of choices)row.setAttribute('aria-selected',String(option.value===selected));
 }
 function position(){
  const anchor=trigger.getBoundingClientRect(),viewport=window.visualViewport;
  const left=viewport?.offsetLeft||0,top=viewport?.offsetTop||0;
  const width=viewport?.width||innerWidth,height=viewport?.height||innerHeight;
  const margin=12,gap=8;
  const minimum=select.id==='scene-location'?272:select.id==='crowd-select'?207:0;
  const menuWidth=Math.min(width-margin*2,Math.max(anchor.width,minimum));
  const below=top+height-margin-anchor.bottom-gap,above=anchor.top-top-margin-gap;
  const desired=Math.min(480,list.scrollHeight+2);
  const up=below<desired&&above>below;
  const available=Math.max(1,up?above:below);
  list.style.width=menuWidth+'px';
  list.style.maxHeight=Math.min(480,available)+'px';
  list.style.left=Math.max(left+margin,Math.min(anchor.left,left+width-menuWidth-margin))+'px';
  list.style.top=(up?Math.max(top+margin,anchor.top-gap-list.offsetHeight):anchor.bottom+gap)+'px';
 }
 function mark(index,scroll=true){
  choices[active]?.row.removeAttribute('data-active');
  active=index;
  const row=choices[active]?.row;
  if(!row){trigger.removeAttribute('aria-activedescendant');return}
  row.dataset.active='';
  trigger.setAttribute('aria-activedescendant',row.id);
  if(!scroll)return;
  const outer=list.getBoundingClientRect(),inner=row.getBoundingClientRect();
  if(inner.bottom>outer.bottom-5)list.scrollTop+=inner.bottom-outer.bottom+5;
  if(inner.top<outer.top+5)list.scrollTop+=inner.top-outer.top-5;
 }
 function openMenu(){
  closeGlassMenu();refresh();open=true;opened={wrapper,close,position};
  trigger.setAttribute('aria-expanded','true');
  trigger.focus({preventScroll:true});
  list.showPopover();
  list.scrollTop=0;
  position();
  mark(Math.max(0,choices.findIndex(({row})=>row.getAttribute('aria-selected')==='true')));
 }
 function close(){
  if(!open)return;
  open=false;opened=null;mark(-1);
  trigger.setAttribute('aria-expanded','false');
  if(list.isConnected)list.hidePopover();
  typed='';
 }
 function commit(index){
  const choice=choices[index];
  if(!choice)return;
  close();
  if(select.value!==choice.option.value){
   select.value=choice.option.value;
   select.dispatchEvent(new Event('change',{bubbles:true}));
  }
  refresh();
 }
 function normalize(word){return word.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('đ','d')}
 trigger.addEventListener('click',()=>open?close():openMenu());
 trigger.addEventListener('keydown',event=>{
  if(event.key==='Tab'){close();return}
  if(event.key==='Escape'&&!open)return;
  if(event.metaKey||event.ctrlKey||event.altKey)return;
  const key=event.key;
  if(!['ArrowDown','ArrowUp','Home','End','Enter',' ','Escape'].includes(key)&&key.length!==1)return;
  event.preventDefault();event.stopPropagation();
  const wasOpen=open;
  if(key==='Escape'){close();return}
  if(!wasOpen)openMenu();
  if(key==='Enter'||key===' '){if(wasOpen)commit(active);return}
  if(key==='ArrowDown'||key==='ArrowUp'){
   if(wasOpen)mark(Math.max(0,Math.min(choices.length-1,active+(key==='ArrowDown'?1:-1))));
   else if(key==='ArrowUp'&&!select.value)mark(choices.length-1);
  }else if(key==='Home'||key==='End')mark(key==='Home'?0:choices.length-1);
  else{
   const now=performance.now(),letter=normalize(key);
   typed=now-typedAt<650?typed+letter:letter;
   typedAt=now;
   const index=choices.findIndex(({option})=>normalize(option.label).startsWith(typed));
   if(index>=0)mark(index);
  }
 });
 list.addEventListener('mousedown',event=>event.preventDefault());
 select.addEventListener('change',refresh);
 enhanced.set(select,{refresh,trigger});
 refresh();
}

document.addEventListener('pointerdown',event=>{
 if(opened&&!opened.wrapper.contains(event.target))closeGlassMenu();
},true);
document.addEventListener('focusin',event=>{
 if(opened&&!opened.wrapper.contains(event.target))closeGlassMenu();
});
document.addEventListener('scroll',event=>{
 if(opened&&!opened.wrapper.contains(event.target))opened.position();
},true);
window.addEventListener('resize',()=>opened?.position());
window.visualViewport?.addEventListener('resize',()=>opened?.position());
