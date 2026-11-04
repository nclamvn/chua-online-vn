// A slow path can be retried once while the original write is still in flight.
// Both copies carry the same sequence or event ID and commit at most once.
export function sendPresenceWrite(send,delay){
 const controller=new AbortController();
 return new Promise((resolve,reject)=>{
  let settled=false,remaining=2;
  const finish=(callback,value)=>{
   if(settled)return;
   settled=true;
   clearTimeout(timer);
   controller.abort();
   callback(value);
  };
  const attempt=()=>send(controller.signal).then(
   value=>finish(resolve,value),
   error=>{
    const retryable=!error.status||error.status===429||error.status>=500;
    if(--remaining===0||!retryable)finish(reject,error);
   }
  );
  const timer=setTimeout(attempt,delay);
  attempt();
 });
}

export const GREETING_HEDGE_MS=350;
export const MOVEMENT_HEDGE_MS=520;
export const SEAT_HEDGE_MS=350;
