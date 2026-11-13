import {conversationMessages,speakingTurn} from './speech.js';
import {placeSpeech} from './scene-performance.js';

const speakerColors=[
 '#a32638','#145ca2','#773c96','#9b5100','#236645','#9f2c73','#4242a6',
 '#963e16','#4b650b','#60377a','#816000','#006a70','#8b413a','#503c61'
];
const clamp=(value,min,max)=>Math.max(min,Math.min(value,max));

export function createSpeechOverlay(root,people,project){
 const layer=document.createElement('div');
 layer.className='speech-overlay';
 root.append(layer);
 const stacks=new Map();
 const characters=new Map(people.map((p,i)=>[p.name,{...p,color:speakerColors[i]}]));
 const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');

 function updateStack(stack,messages,residents,currentTurn){
  const visible=new Set(messages.map(m=>m.turn));
  for(const [turn,node] of stack.nodes){
   if(visible.has(turn))continue;
   node.remove();
   stack.nodes.delete(turn);
  }
  const previousHeight=stack.element.offsetHeight;
  const oldNodes=[...stack.nodes.values()];
  for(const message of messages){
   let node=stack.nodes.get(message.turn);
   if(!node){
    const speaker=residents.get(message.speaker);
    node=document.createElement('p');
    node.className='speech-message';
    node.style.setProperty('--speaker-color',speaker.color);
    const name=document.createElement('strong');
    name.textContent=speaker.name+': ';
    node.append(name,document.createTextNode(message.text));
    stack.element.append(node);
    stack.nodes.set(message.turn,node);
   }
   node.style.opacity=message.opacity;
   node.classList.toggle('speaking',message.turn===currentTurn);
  }
  if(!reduceMotion.matches&&stack.nodes.size>oldNodes.length&&oldNodes.length){
   const rise=stack.element.offsetHeight-previousHeight;
   for(const node of oldNodes){
    node.animate([{transform:'translateY('+rise+'px)'},{transform:'translateY(0)'}],
     {duration:240,easing:'ease-out'});
   }
  }
 }

 return function render(world,now,elapsed){
  const active=new Set();
  const residents=new Map((world?.people??[]).map(p=>[p.id,characters.get(p.name)]));
  const occupied=[];
  const width=root.clientWidth,height=root.clientHeight;
  const heads=[];
  const toPixels=point=>({x:(point.x+1)*width/2,y:(1-point.y)*height/2});
  const obstacles=()=>{
   for(const person of characters.values()){
    const rect=project(person.rig.head,.68);
    if(rect)heads.push(rect);
   }
   for(const el of root.querySelectorAll('.scene-label,.hint')){
    heads.push({x:el.offsetLeft,y:el.offsetTop,w:el.offsetWidth,h:el.offsetHeight});
   }
  };
  const groupTalk=Object.values(world?.groupEvents??{}).filter(event=>event.dialogue).map(event=>[event.id,event.dialogue]);
  for(const [id,conversation] of [...Object.entries(world?.conversations??{}),...groupTalk]){
   const end=conversation.cancelledAt??conversation.end;
   const messages=conversationMessages(conversation,now,now>=end?elapsed(end):0);
   if(!messages.length)continue;
   const pair=conversation.participants.map(id=>residents.get(id));
   if(pair.some(p=>!p))continue;
   active.add(id);
   let stack=stacks.get(id);
   if(!stack){
    const element=document.createElement('div');
    element.className='speech-stack';
    layer.append(element);
    stack={element,nodes:new Map()};
    stacks.set(id,stack);
   }
   if(now<end||!stack.anchor){
    const onStage=conversation.speakers?pair.filter((p,i)=>world.people.find(r=>r.id===conversation.participants[i])?.action?.groupId===id):pair;
    const anchor=onStage.length?onStage:pair;
    stack.anchor={
     x:anchor.reduce((sum,p)=>sum+p.g.position.x,0)/anchor.length,
     y:Math.max(...anchor.map(p=>p.tag.position.y))+.55,
     z:anchor.reduce((sum,p)=>sum+p.g.position.z,0)/anchor.length
    };
   }
   const point=project(stack.anchor);
   const inView=Math.abs(point.x)<=1.15&&Math.abs(point.y)<=1.2&&Math.abs(point.z)<=1;
   stack.element.hidden=!inView;
   if(!inView)continue;
   const anchor=toPixels(point);
   if(!heads.length)obstacles();
   updateStack(stack,messages,residents,speakingTurn(conversation,now)?.turn);
   const w=stack.element.offsetWidth,h=stack.element.offsetHeight;
   const {x,y}=placeSpeech({...anchor,w,h,width,height,heads,occupied});
   occupied.push({x,y,w,h});
   stack.element.style.setProperty('--tail-x',clamp(anchor.x-x,15,w-15)+'px');
   stack.element.classList.toggle('tail-up',y>anchor.y);
   stack.element.style.transform='translate('+Math.round(x)+'px,'+Math.round(y)+'px)';
  }
  for(const [id,stack] of stacks){
   if(active.has(id))continue;
   stack.element.remove();
   stacks.delete(id);
  }
 };
}
