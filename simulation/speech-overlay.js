import {conversationMessages} from './speech.js';

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

 function updateStack(stack,messages,residents){
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
  for(const [id,conversation] of Object.entries(world?.conversations??{})){
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
    const [a,b]=pair;
    stack.anchor={
     x:(a.g.position.x+b.g.position.x)/2,
     y:Math.max(a.tag.position.y,b.tag.position.y)+.55,
     z:(a.g.position.z+b.g.position.z)/2
    };
   }
   const point=project(stack.anchor);
   const inView=Math.abs(point.x)<=1.15&&Math.abs(point.y)<=1.2&&Math.abs(point.z)<=1;
   stack.element.hidden=!inView;
   if(!inView)continue;
   updateStack(stack,messages,residents);
   const w=stack.element.offsetWidth,h=stack.element.offsetHeight;
   const margin=8;
   const preferredX=(point.x+1)*width/2-w/2;
   const preferredY=(1-point.y)*height/2-h-6;
   const left=value=>clamp(value,margin,width-w-margin);
   const top=value=>clamp(value,margin,height-h-margin);
   let x=left(preferredX),y=top(preferredY);
   for(const other of occupied){
    if(x+w<=other.x||x>=other.x+other.w||y+h<=other.y||y>=other.y+other.h)continue;
    if(other.y-h-margin>=margin)y=other.y-h-margin;
    else if(other.x+other.w+w+2*margin<=width)x=other.x+other.w+margin;
    else if(other.x-w-margin>=margin)x=other.x-w-margin;
   }
   occupied.push({x,y,w,h});
   stack.element.style.transform='translate('+Math.round(x)+'px,'+Math.round(y)+'px)';
  }
  for(const [id,stack] of stacks){
   if(active.has(id))continue;
   stack.element.remove();
   stacks.delete(id);
  }
 };
}
