import {unpackPresence} from './presence-wire.js';

export async function readPresenceFeed(url,body,signal,onFrame){
 const response=await fetch(url,{
  method:'POST',headers:{'Content-Type':'application/json','Accept':'text/event-stream'},
  body:JSON.stringify(body),signal,cache:'no-store'
 });
 if(!response.ok||!response.headers.get('Content-Type')?.startsWith('text/event-stream')||!response.body){
  throw new Error('Không mở được luồng cập nhật.');
 }
 const reader=response.body.getReader(),decoder=new TextDecoder();
 let buffer='';
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   buffer+=decoder.decode(value,{stream:true});
   if(buffer.length>1024*1024)throw new Error('Gói cập nhật quá lớn.');
   let boundary;
   while((boundary=buffer.indexOf('\n\n'))>=0){
    const message=buffer.slice(0,boundary);
    buffer=buffer.slice(boundary+2);
    if(message.startsWith('data: '))onFrame(unpackPresence(JSON.parse(message.slice(6))));
   }
  }
 }finally{
  await reader.cancel().catch(()=>{});
  reader.releaseLock();
 }
}
