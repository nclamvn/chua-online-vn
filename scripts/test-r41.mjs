import assert from 'node:assert/strict';
import {setTimeout as wait} from 'node:timers/promises';

const base=process.env.HIEN_AN_TEST_URL||'http://127.0.0.1:4387';
const room='hien-an-03';
const sessions=[];

async function post(action,data,expected=200){
  const response=await fetch(`${base}/api/presence/${action}`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({room,...data}),
    signal:AbortSignal.timeout(10000)
  });
  const body=await response.json();
  assert.equal(response.status,expected,`${action}: ${body.error||response.status}`);
  return body;
}

async function join(greetingEvents){
  const joined=await post('join',{greetingEvents});
  const {id,token}=joined;
  const player=joined.players.find(p=>p.id===id);
  const session={id,token};
  sessions.push(session);
  return {session,player};
}

try{
  const sender=await join(true);
  const receiver=await join(true);
  const legacy=await join(false);
  assert.deepEqual(sender.player.greetings,[]);
  assert.equal(legacy.player.greetings,null);

  const eventId=crypto.randomUUID();
  const greeting={...sender.session,eventId};
  await post('greet',{...greeting,room:'hien-an-02'},409);
  const retries=await Promise.all([post('greet',greeting),post('greet',greeting)]);
  assert(retries.every(reply=>reply.eventId===eventId));

  // Model a slow observer which polls after the local greeting pose has finished.
  await wait(2400);
  // An active sender keeps its presence lease while the observer waits.
  await post('sync',{
    ...sender.session,seq:1,state:{x:sender.player.x,z:sender.player.z,yaw:0,pose:'idle'}
  });
  const {players}=await post('sync',{
    ...receiver.session,seq:1,state:{x:receiver.player.x,z:receiver.player.z,yaw:0,pose:'idle'}
  });
  const peer=players.find(player=>player.id===sender.session.id);
  assert.equal(peer.pose,'idle');
  assert.deepEqual(peer.greetings.map(event=>event.id),[eventId]);

  const probe=await post('greetings',receiver.session);
  assert.deepEqual(probe.players,[{id:sender.session.id,greetings:peer.greetings}]);
  const wrongRoom=await post('greetings',{...receiver.session,room:'hien-an-02'});
  const wrongToken=await post('greetings',{...receiver.session,token:crypto.randomUUID()});
  assert.deepEqual(wrongRoom.players,[]);
  assert.deepEqual(wrongToken.players,[]);

  const lateJoin=await join(true);
  assert.deepEqual(lateJoin.player.greetings,[]);
  await wait(150);
  const lateSnapshot=await post('sync',{
    ...lateJoin.session,seq:1,state:{x:lateJoin.player.x,z:lateJoin.player.z,yaw:0,pose:'idle'}
  });
  assert.deepEqual(lateSnapshot.players.find(player=>player.id===sender.session.id).greetings,[]);
  assert.deepEqual((await post('greetings',lateJoin.session)).players,[]);
  console.log('Passed: legacy sender, room isolation, concurrent duplicate, delayed observation, authorized read-only probe and late join.');
} finally {
  await Promise.all(sessions.map(session=>post('leave',session)));
}
