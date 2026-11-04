// The order is shared by the Worker and browser. Full objects remain supported for old clients.
export function packPlayer(p){
 const {profile,hair,outfit,palette}=p.appearance;
 return [p.id,p.name,profile,hair,outfit,palette,p.x,p.y,p.z,p.yaw,p.pose,p.seat,p.seq,p.updatedAt,p.greetings];
}

export function unpackPresence(payload){
 if(!payload.compact)return payload;
 const players=payload.players.map(([id,name,profile,hair,outfit,palette,x,y,z,yaw,pose,seat,seq,updatedAt,greetings])=>
  ({id,name,appearance:{profile,hair,outfit,palette},x,y,z,yaw,pose,seat,seq,updatedAt,greetings}));
 return {...payload,players};
}
