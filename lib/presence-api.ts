import {isJsonObject,readJsonObject} from './request-json';
import {packPlayer} from '../public/presence-wire.js';
import {arrivalPoints,destinationPoints,BODY_DISTANCE} from '../public/body-collision.js';
import {clearSegment} from '../public/pathfinding.js';
import {ROOMS,CAPACITY,SEATS,validPosition,groundHeight,ZONES,normalizeAppearance,GREETING_WINDOW_MS,GREETING_LIMIT} from '../public/world-rules.js';
const TTL=15000;
const MIN_WRITE_GAP_MS=100;
const SNAPSHOT_MS=120;
const FEED_TICK_MS=70;
const FEED_REFRESH_MS=80;
const FEED_HEARTBEAT_MS=1000;
const FEED_LEASE_MS=4000;
const FEED_MAX_MS=60000;
const columns='id,name,appearance,greetings,x,z,yaw,pose,seat,seq,updated_at';
type PresenceRow={id:string;name:string;appearance:string;greetings:string|null;x:number;z:number;yaw:number;pose:string;seat:string|null;seq:number;updated_at:number};
type SessionRow=PresenceRow & {token_hash:string;room:string;joined_at:number};
const sessions=new Map<string,SessionRow>();
function rememberSession(row:SessionRow){
 const previous=sessions.get(row.id);
 if(previous&&previous.seq>row.seq)return;
 sessions.delete(row.id);
 sessions.set(row.id,row);
 if(sessions.size>CAPACITY*ROOMS.length*2){
  const oldest=sessions.keys().next().value;
  if(oldest)sessions.delete(oldest);
 }
}
async function readSession(db:D1Database,id:string,hash:string,room:string,now:number,baseSeq?:number){
 const cached=sessions.get(id);
 if(cached?.token_hash===hash&&cached.room===room&&cached.updated_at>=now-TTL&&(baseSeq===undefined||cached.seq===baseSeq))return cached;
 const row=await db.prepare(`SELECT ${columns},token_hash,room,joined_at FROM presence WHERE id=? AND token_hash=? AND room=? AND updated_at>=?`)
  .bind(id,hash,room,now-TTL).first<SessionRow>();
 if(row)rememberSession(row);
 return row;
}
type Player=ReturnType<typeof safePlayer>;
type RoomSnapshot={readAt:number;players:Player[];byId:Map<string,Player>};
const snapshots=new Map<string,RoomSnapshot>();
const refreshingRooms=new Map<string,{started:number}>();
async function refreshSnapshot(db:D1Database,room:string,now:number){
 const {results}=await db.prepare(`SELECT ${columns} FROM presence WHERE room=? AND updated_at>=?`)
  .bind(room,now-TTL).all<PresenceRow>();
 const previous=snapshots.get(room);
 if(previous&&previous.readAt>now)return previous;
 const players=results.map(row=>{
  const player=safePlayer(row,now,0);
  const newer=previous?.byId.get(row.id);
  // A read already in flight can return just before a confirmed seat write.
  return newer&&newer.seq>player.seq
   ? {...newer,greetings:player.greetings,updatedAt:Math.max(newer.updatedAt,player.updatedAt)}
   : player;
 });
 const snapshot={readAt:now,players,byId:new Map(players.map(player=>[player.id,player]))};
 snapshots.set(room,snapshot);
 return snapshot;
}
function publishConfirmedSeat(room:string,row:PresenceRow,now:number){
 if(!row.seat)return;
 const snapshot=snapshots.get(room);
 const current=snapshot?.byId.get(row.id);
 if(!snapshot||!current||current.seq>=row.seq)return;
 const player=safePlayer(row,now,0);
 const players=snapshot.players.map(peer=>peer.id===player.id?player:peer);
 const byId=new Map(snapshot.byId);
 byId.set(player.id,player);
 // Keep the original read time so the room still refreshes from D1 on schedule.
 snapshots.set(room,{readAt:snapshot.readAt,players,byId});
}
async function sharedSnapshot(db:D1Database,room:string,now:number){
 const previous=snapshots.get(room);
 return (previous&&now-previous.readAt<SNAPSHOT_MS?previous:await refreshSnapshot(db,room,now)).players;
}
async function feedSnapshot(db:D1Database,room:string,now:number){
 const previous=snapshots.get(room);
 const inFlight=refreshingRooms.get(room);
 if((inFlight&&now-inFlight.started<500)||(previous&&now-previous.readAt<FEED_REFRESH_MS))return previous;
 // A request reads D1 in its own context. Other streams use only completed snapshots.
 // The lock expires if a disconnected request is cancelled before its cleanup runs.
 const refresh={started:now};
 refreshingRooms.set(room,refresh);
 try{return await refreshSnapshot(db,room,now)}
 finally{if(refreshingRooms.get(room)===refresh)refreshingRooms.delete(room)}
}
async function visiblePeers(db:D1Database,room:string,now:number,current:SessionRow){
 const snapshot=await sharedSnapshot(db,room,now);
 const earliest=Math.max(now-GREETING_WINDOW_MS,current.joined_at);
 return snapshot.filter(p=>p.id!==current.id&&p.updatedAt>=now-TTL).map(p=>
  p.greetings?.length&&p.greetings[0].at<earliest
   ? {...p,greetings:p.greetings.filter(event=>event.at>=earliest)} : p
 );
}
function snapshotReply(players:Player[],now:number,corrected:boolean,compact:boolean){
 return compact?reply({serverTime:now,compact:true,players:players.map(packPlayer),corrected})
  :reply({serverTime:now,players,corrected});
}
function sameFeedPlayer(previous:Player|undefined,next:Player){
 return previous!==undefined&&previous.seq===next.seq&&previous.greetings?.at(-1)?.id===next.greetings?.at(-1)?.id;
}
function streamRoom(db:D1Database,session:SessionRow){
 const deadline=Date.now()+FEED_MAX_MS-Math.random()*7000;
 const {room,id,token_hash,joined_at}=session;
 const encoder=new TextEncoder();
 let seen:RoomSnapshot|undefined,lastPacket=0;
 let nextLease=session.updated_at+FEED_LEASE_MS,missingSince=0,cancelled=false;
 const stream=new ReadableStream<Uint8Array>({
  async pull(controller){
   try{
    while(!cancelled){
     const now=Date.now();
     if(now>=deadline){controller.close();return}
     const snapshot=await feedSnapshot(db,room,now);
     if(cancelled)return;
     const self=snapshot?.byId.get(id);
     if(self){
      missingSince=0;
      nextLease=Math.max(nextLease,self.updatedAt+FEED_LEASE_MS);
     }else if(snapshot){
      missingSince||=now;
      if(now-missingSince>=1000){controller.close();return}
     }
     if(now>=nextLease){
      // Movement writes also renew the lease. The SQL guard prevents a second write.
      await db.prepare('UPDATE presence SET updated_at=? WHERE id=? AND token_hash=? AND room=? AND updated_at BETWEEN ? AND ?')
       .bind(now,id,token_hash,room,now-TTL,now-FEED_LEASE_MS).run();
      if(cancelled)return;
      nextLease=now+FEED_LEASE_MS;
     }
     let frame;
     if(snapshot&&snapshot!==seen&&self){
      const full=!seen;
      const changes=snapshot.players.filter(player=>!sameFeedPlayer(seen?.byId.get(player.id),player)).map(player=>{
       const events=player.greetings?.filter(event=>event.at>=Math.max(joined_at,now-GREETING_WINDOW_MS));
       return packPlayer(events?{...player,greetings:events}:player);
      });
      const left=seen?[...seen.byId.keys()].filter(peer=>!snapshot.byId.has(peer)):[];
      seen=snapshot;
      if(full||changes.length||left.length)frame={serverTime:now,compact:true,full,players:changes,left};
     }
     if(!frame&&lastPacket&&now-lastPacket>=FEED_HEARTBEAT_MS)frame={serverTime:now};
     if(frame){
      lastPacket=now;
      controller.enqueue(encoder.encode('data: '+JSON.stringify(frame)+'\n\n'));
      return;
     }
     await new Promise<void>(resolve=>setTimeout(resolve,FEED_TICK_MS));
    }
   }catch(error){
    if(!cancelled)controller.error(error);
   }
  },
  cancel(){cancelled=true}
 });
 return new Response(stream,{headers:{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-store, no-transform','X-Accel-Buffering':'no'}});
}
const noStore={'Cache-Control':'no-store, private','Content-Type':'application/json'};
function reply(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:noStore})}
async function hash(s:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(v=>v.toString(16).padStart(2,'0')).join('')}
function destination(value:unknown){return typeof value==='string'&&Object.hasOwn(ZONES,value)?ZONES[value as keyof typeof ZONES]:null}
type Greeting={id:string;at:number};
function recentGreetings(value:string|null,now:number,joinedAt:number){
 const earliest=Math.max(now-GREETING_WINDOW_MS,joinedAt);
 return value===null?null:(JSON.parse(value) as Greeting[]).filter(event=>event.at>=earliest);
}
// This check lives in the same SQLite statement as the write. Two requests
// targeting the same spot cannot both pass using an earlier room snapshot.
const spawnSQL=`
 WITH points AS MATERIALIZED (
   SELECT key AS idx,json_extract(value,'$.x') AS x,json_extract(value,'$.z') AS z
   FROM json_each(?1)
 ), free AS (
   SELECT p.x,p.z FROM points p
   WHERE NOT EXISTS(
     SELECT 1 FROM presence AS peer
     WHERE peer.room=?2 AND peer.updated_at>=?3
       AND peer.x BETWEEN p.x-${BODY_DISTANCE} AND p.x+${BODY_DISTANCE}
       AND peer.z BETWEEN p.z-${BODY_DISTANCE} AND p.z+${BODY_DISTANCE}
       AND (p.x-peer.x)*(p.x-peer.x)+(p.z-peer.z)*(p.z-peer.z)<${BODY_DISTANCE**2}
   )
   ORDER BY p.idx LIMIT 1
 )`;
const freePointsSQL=`
 WITH points AS MATERIALIZED (
   SELECT key AS idx,json_extract(value,'$.x') AS x,json_extract(value,'$.z') AS z
   FROM json_each(?1)
 ), neighbors AS (
   SELECT x,z FROM presence WHERE room=?2 AND updated_at>=?3 AND id<>?4
 ), offsets AS (
   SELECT p.idx,p.x-peer.x AS ex,p.z-peer.z AS ez,
     CASE WHEN ?7 THEN ?5-peer.x ELSE p.x-peer.x END AS sx,
     CASE WHEN ?7 THEN ?6-peer.z ELSE p.z-peer.z END AS sz
   FROM points p CROSS JOIN neighbors peer
   WHERE peer.x BETWEEN min(p.x,CASE WHEN ?7 THEN ?5 ELSE p.x END)-${BODY_DISTANCE}
                    AND max(p.x,CASE WHEN ?7 THEN ?5 ELSE p.x END)+${BODY_DISTANCE}
     AND peer.z BETWEEN min(p.z,CASE WHEN ?7 THEN ?6 ELSE p.z END)-${BODY_DISTANCE}
                    AND max(p.z,CASE WHEN ?7 THEN ?6 ELSE p.z END)+${BODY_DISTANCE}
 ), swept AS (
   SELECT *,ex-sx AS dx,ez-sz AS dz FROM offsets
 ), projections AS (
   SELECT *,dx*dx+dz*dz AS length2,-(sx*dx+sz*dz) AS dot FROM swept
 ), contacts AS (
   SELECT *,coalesce(min(1,max(0,dot/nullif(length2,0))),0) AS t FROM projections
 ), free AS (
   SELECT p.x,p.z FROM points p
   WHERE NOT EXISTS(SELECT 1 FROM contacts c WHERE c.idx=p.idx
     AND (c.sx+c.dx*c.t)*(c.sx+c.dx*c.t)+(c.sz+c.dz*c.t)*(c.sz+c.dz*c.t)<${BODY_DISTANCE**2}
     AND NOT (?7 AND c.dot<=0 AND c.length2>0 AND c.sx*c.sx+c.sz*c.sz<${BODY_DISTANCE**2}))
   ORDER BY p.idx LIMIT 1
 )`;
// Short moves confirm the last acknowledged position and any seat claim in one
// statement. Expired reservations use the normal cleanup path.
const fastMoveSQL=`${freePointsSQL}
 UPDATE presence SET x=free.x,z=free.z,yaw=?9,pose=?16,seat=?11,
   appearance=?12,seq=?13,updated_at=?14
 FROM free
 WHERE presence.id=?4 AND presence.token_hash=?8 AND presence.room=?2
   AND presence.seq=?15 AND presence.x=?5 AND presence.z=?6
   AND presence.updated_at BETWEEN ?3 AND ?10
   AND (?11 IS NULL OR NOT EXISTS(
    SELECT 1 FROM presence AS peer WHERE peer.room=?2 AND peer.seat=?11 AND peer.id<>?4))
 RETURNING ${columns},joined_at`;
function safePlayer(p:PresenceRow,now:number,joinedAt:number){
 return {greetings:recentGreetings(p.greetings,now,joinedAt),id:p.id,name:p.name,appearance:normalizeAppearance(JSON.parse(p.appearance||'{}')),x:p.x,y:groundHeight(p.x,p.z),z:p.z,yaw:p.yaw,pose:p.pose,seat:p.seat,seq:p.seq,updatedAt:p.updated_at}}
function parseMovement(value:unknown,seq:unknown){
 if(!isJsonObject(value)||typeof seq!=='number'||!Number.isSafeInteger(seq)||seq<1)return null;
 const {x,z,yaw,pose,seat,appearance,travelTo}=value;
 if(typeof x!=='number'||!Number.isFinite(x)||typeof z!=='number'||!Number.isFinite(z)||
    typeof yaw!=='number'||!Number.isFinite(yaw)||Math.abs(yaw)>100||
    typeof pose!=='string'||!['idle','walk','greet','meditate','prostrate'].includes(pose))return null;
 return {x,z,yaw,pose,seat,appearance,travelTo,seq};
}
export async function handlePresence(request:Request,db:D1Database|undefined,action:string){
 if(request.method==='GET'){
  if(action!=='rooms')return reply({error:'Dùng POST để tham gia phòng.'},405);
  if(!db)return reply({error:'Chưa kết nối phòng.'},503);
  const now=Date.now();
  const rows=await db.prepare('SELECT room,COUNT(*) AS count FROM presence WHERE updated_at>=? GROUP BY room')
   .bind(now-TTL).all<{room:string;count:number}>();
  const counts=new Map(rows.results.map(row=>[row.room,row.count]));
  return reply({rooms:ROOMS.map(id=>({id,count:counts.get(id)??0,capacity:CAPACITY})),serverTime:now});
 }
 if(request.method!=='POST')return reply({error:'Phương thức không hợp lệ.'},405);
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return reply({error:'Nguồn yêu cầu không hợp lệ.'},403);
 const json=await readJsonObject(request);
 if(!json.ok)return reply({error:json.status===413?'Yêu cầu quá lớn.':'JSON không hợp lệ.'},json.status);
 if(!db)return reply({error:'Phòng chung chưa sẵn sàng.'},503);
 const {body}=json;
 const now=Date.now(),room=body.room;
 if(typeof room!=='string'||!ROOMS.includes(room))return reply({error:'Phòng không hợp lệ.'},400);
 try{
 if(action==='join'){
   // Atomic conditional insertion prevents simultaneous joins exceeding room capacity.
   const id=crypto.randomUUID(),token=crypto.randomUUID()+crypto.randomUUID(),tokenHash=await hash(token);
   const appearance=JSON.stringify(normalizeAppearance(body.appearance));
   const names=['Sen','Trúc','Mây','Gió','Lá','Suối'];const name=names[crypto.getRandomValues(new Uint32Array(1))[0]%names.length]+' '+id.slice(0,4);
   const arrival=destination(body.travelTo),center=arrival?.point??[0,7.4];
   const choices=destinationPoints(body.travelTo,center[0],center[1]);
   const results=await db.batch<PresenceRow>([
    db.prepare('DELETE FROM presence WHERE updated_at < ?').bind(now-TTL),
    db.prepare(`${spawnSQL}
      INSERT INTO presence(id,token_hash,room,name,appearance,greetings,x,z,yaw,pose,seq,updated_at,joined_at)
      SELECT ?4,?5,?2,?6,?7,?8,x,z,0,'idle',0,?9,?9 FROM free
      WHERE (SELECT COUNT(*) FROM presence WHERE room=?2) < ?10 RETURNING id`)
     .bind(JSON.stringify(choices),room,now-TTL,id,tokenHash,name,appearance,body.greetingEvents===true?'[]':null,now,CAPACITY),
    db.prepare('SELECT * FROM presence WHERE room=? AND updated_at>=?').bind(room,now-TTL)
   ]);
   if(!results[1].results.length)return reply({error:'Chưa có chỗ trống để vào sân. Hãy thử lại hoặc chọn sân khác.'},409);
   const self=results[2].results.find(p=>p.id===id);
   if(self)rememberSession({...self,token_hash:tokenHash,room,joined_at:now});
   return reply({id,token,room,name,serverTime:now,capacity:CAPACITY,players:results[2].results.map(p=>safePlayer(p,now,now))});
 }
 if(typeof body.id!=='string'||body.id.length>50||typeof body.token!=='string'||body.token.length>100)return reply({error:'Phiên không hợp lệ.'},401);
 const tokenHash=await hash(body.token);
 if(action==='leave'){
   await db.prepare('DELETE FROM presence WHERE id=? AND token_hash=? AND room=?').bind(body.id,tokenHash,room).run();
   if(sessions.get(body.id)?.token_hash===tokenHash)sessions.delete(body.id);
   return reply({ok:true});
 }
 if(action==='greetings'){
   // A read-only probe can overlap a slow sync without racing movement or seating writes.
   const rows=await db.prepare(`
     SELECT peer.id,peer.greetings,listener.joined_at
     FROM presence AS listener
     JOIN presence AS peer ON peer.room=listener.room AND peer.id<>listener.id
     WHERE listener.id=? AND listener.token_hash=? AND listener.room=? AND listener.updated_at>=?
       AND peer.updated_at>=? AND json_array_length(peer.greetings)>0
   `).bind(body.id,tokenHash,room,now-TTL,now-4500).all<{id:string;greetings:string;joined_at:number}>();
   const players=rows.results.flatMap(peer=>{
     const greetings=recentGreetings(peer.greetings,now,peer.joined_at);
     return greetings?.length?[{id:peer.id,greetings}]:[];
   });
   return reply({players});
 }
 if(action==='greet'){
   const eventId=body.eventId;
   if(typeof eventId!=='string'||!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(eventId)){
     return reply({error:'Mã chắp tay không hợp lệ.'},400);
   }
   // One atomic write. Retrying the same ID acknowledges the original event without extending it.
   const saved=await db.prepare(`
     UPDATE presence SET greetings=CASE
       WHEN EXISTS(SELECT 1 FROM json_each(greetings) WHERE json_extract(value,'$.id')=?1)
         THEN greetings
       ELSE json_insert(
         CASE WHEN json_array_length(greetings)>=?2 THEN json_remove(greetings,'$[0]') ELSE greetings END,
         '$[#]',json_object('id',?1,'at',?3))
       END
     WHERE id=?4 AND token_hash=?5 AND room=?6 AND updated_at>=?7 AND greetings IS NOT NULL
       AND (coalesce(json_extract(greetings,'$[#-1].at'),0)<=?8
         OR EXISTS(SELECT 1 FROM json_each(greetings) WHERE json_extract(value,'$.id')=?1))
     RETURNING id
   `).bind(eventId,GREETING_LIMIT,now,body.id,tokenHash,room,now-TTL,now-180).first();
   if(!saved)return reply({error:'Chưa nhận được chắp tay. Hãy thử lại.'},409);
   return reply({eventId});
 }
 if(action==='stream'){
   const session=await readSession(db,body.id,tokenHash,room,now,-1);
   return session?streamRoom(db,session):reply({error:'Phiên đã hết hạn. Đang vào lại sân.'},401);
 }
 if(action!=='sync'&&action!=='observe')return reply({error:'Không có thao tác này.'},404);
 const ackOnly=body.snapshot==='ack';
 const baseSeq=typeof body.baseSeq==='number'&&Number.isSafeInteger(body.baseSeq)?body.baseSeq:-1;
 const s=action==='sync'?parseMovement(body.state,body.seq):null;
 const travel=s?destination(s.travelTo):null;
 let seat=null;
 if(action==='sync'){
   if(!s)return reply({error:'Trạng thái không hợp lệ.'},400);
   seat=s.pose==='meditate'?SEATS.find(p=>p.id===s.seat&&Math.hypot(p.x-s.x,p.z-s.z)<.4):null;
   if(s.pose==='meditate'&&!seat)return reply({error:'Hãy ngồi trên một bồ đoàn.'},400);
   if(ackOnly&&!travel&&baseSeq>=0&&s.seq>baseSeq&&Array.isArray(body.basePosition)){
    const [x,z]=body.basePosition;
    // With a 100 ms minimum interval the ordinary speed check permits up to 1.4 m.
    if(Math.hypot(x-s.x,z-s.z)<=1.4&&validPosition(x,z)&&validPosition(s.x,s.z)&&clearSegment({x,z},s)){
     const saved=await db.prepare(fastMoveSQL).bind(
      JSON.stringify([{x:s.x,z:s.z}]),room,now-TTL,body.id,x,z,1,tokenHash,s.yaw,now-MIN_WRITE_GAP_MS,
      seat?.id??null,JSON.stringify(normalizeAppearance(s.appearance)),s.seq,now,baseSeq,s.pose
     ).first<PresenceRow & {joined_at:number}>();
     if(saved){
      rememberSession({...saved,token_hash:tokenHash,room});
      publishConfirmedSeat(room,saved,now);
      return snapshotReply([safePlayer(saved,now,saved.joined_at)],now,false,true);
     }
    }
   }
 }
 // The last confirmed sequence tells us whether this isolate has the right position.
 // Legacy writers and writers without a confirmed position read D1 directly.
 const current=await readSession(db,body.id,tokenHash,room,now,action==='observe'?undefined:baseSeq);
 if(!current)return reply({error:'Phiên đã hết hạn. Đang vào lại sân.'},401);
 if(action==='observe'){
   let self:PresenceRow=current;
   if(now-current.updated_at>=3500){
    const saved=await db.prepare(`UPDATE presence SET updated_at=max(updated_at,?)
      WHERE id=? AND token_hash=? AND room=? AND updated_at>=? RETURNING ${columns}`)
     .bind(now,body.id,tokenHash,room,now-TTL).first<PresenceRow>();
    if(!saved){
     if(sessions.get(body.id)===current)sessions.delete(body.id);
     return reply({error:'Phiên đã hết hạn. Đang vào lại sân.'},401);
    }
    self=saved;
    rememberSession({...current,...saved});
   }
   const peers=await visiblePeers(db,room,now,current);
   return snapshotReply([safePlayer(self,now,current.joined_at),...peers],now,false,true);
 }
 if(!s)return reply({error:'Trạng thái không hợp lệ.'},400);
 const repeatAck=(row:SessionRow)=>snapshotReply([safePlayer(row,now,row.joined_at)],now,
   Boolean(travel||row.x!==s.x||row.z!==s.z),true);
 if(ackOnly&&s.seq===current.seq)return repeatAck(current);
 if(now-current.updated_at<MIN_WRITE_GAP_MS)return reply({error:'Xin chậm lại.'},429);
 if(s.seq<=current.seq)return reply({error:'Gói trạng thái đã cũ.'},409);
 const dt=Math.min((now-current.updated_at)/1000,15);
 const tooFar=!travel&&Math.hypot(s.x-current.x,s.z-current.z)>6*dt+.8;
 const inside=validPosition(current.x,current.z);
 const safeMove=inside&&!tooFar&&validPosition(s.x,s.z)&&clearSegment(current,s);
 const choices=travel?destinationPoints(s.travelTo,travel.point[0],travel.point[1]):
   !inside?arrivalPoints(current.x,current.z,true):safeMove?[{x:s.x,z:s.z}]:[];
 const appearance=JSON.stringify(normalizeAppearance(s.appearance));
 const sweep=Number(!travel&&inside);
 // Seat ownership remains atomic with movement. A blocked move keeps the prior position.
 const write=db.prepare(`${freePointsSQL}, chosen AS (
    SELECT x,z,1 AS accepted FROM free
    UNION ALL SELECT ?5,?6,0 WHERE NOT EXISTS(SELECT 1 FROM free)
   )
   UPDATE presence SET x=chosen.x,z=chosen.z,yaw=?9,
     pose=CASE WHEN chosen.accepted AND ?7 THEN ?10 ELSE 'idle' END,
     seat=CASE WHEN chosen.accepted AND ?7 THEN ?11 ELSE NULL END,
     appearance=?12,seq=?13,updated_at=?14
   FROM chosen
   WHERE presence.id=?4 AND presence.token_hash=?8 AND presence.seq=?15 AND presence.updated_at>=?3
     AND (NOT ?7 OR ?11 IS NULL OR NOT EXISTS(
       SELECT 1 FROM presence AS peer WHERE peer.room=?2 AND peer.seat=?11 AND peer.id<>?4))
   RETURNING ${columns}`)
   .bind(JSON.stringify(choices),room,now-TTL,body.id,current.x,current.z,sweep,tokenHash,s.yaw,s.pose,seat?.id||null,appearance,s.seq,now,current.seq);
 // Release expired reservations only when someone claims that seat.
 const staleSeat=seat&&seat.id!==current.seat
   ? db.prepare('DELETE FROM presence WHERE room=? AND seat=? AND updated_at<?').bind(room,seat.id,now-TTL)
   : null;
 let saved:PresenceRow|null, peers:Player[];
 if(ackOnly||body.snapshot==='shared'||body.snapshot==='compact'){
   const update=staleSeat
     ? db.batch<PresenceRow>([staleSeat,write]).then(results=>results[1].results[0]??null)
     : write.first<PresenceRow>();
   if(ackOnly){
    saved=await update;
    peers=[];
   }else{
    [saved,peers]=await Promise.all([update,visiblePeers(db,room,now,current)]);
   }
 }else{
   const read=db.prepare(`SELECT ${columns} FROM presence WHERE room=? AND updated_at>=?`).bind(room,now-TTL);
   const results=await db.batch<PresenceRow>(staleSeat?[staleSeat,write,read]:[write,read]);
   saved=results.at(-2)?.results[0]??null;
   peers=(results.at(-1)?.results??[]).filter(p=>p.id!==body.id).map(p=>safePlayer(p,now,current.joined_at));
 }
 if(!saved){
   if(sessions.get(body.id)===current)sessions.delete(body.id);
   const fresh=await readSession(db,body.id,tokenHash,room,now,-1);
   if(!fresh)return reply({error:'Phiên đã hết hạn. Đang vào lại sân.'},401);
   if(ackOnly&&fresh.seq===body.seq)return repeatAck(fresh);
   if(fresh.seq!==current.seq)return reply({error:'Gói trạng thái đã cũ.'},409);
   return reply({error:'Bồ đoàn này vừa có người ngồi. Mời bạn chọn chỗ khác.',code:'SEAT_TAKEN'},409);
 }
 rememberSession({...current,...saved});
 publishConfirmedSeat(room,saved,now);
 return snapshotReply([safePlayer(saved,now,current.joined_at),...peers],now,
   Boolean(travel||!safeMove||saved.x!==s.x||saved.z!==s.z),(body.snapshot==='compact'||body.snapshot==='ack'));
 }catch(error){console.error('presence request failed',error);return reply({error:'Kết nối sân chung đang gián đoạn. Sẽ thử lại.'},503)}
}
