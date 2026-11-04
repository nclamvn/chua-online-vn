import {ROOMS} from './world-rules.js?v=pond-parking-1';

const minute=60000;
const day=24*60*minute;
export const GATHERING_LENGTHS=[1,3,5];

export function readGathering(params,now){
 const room=params.get('room'), time=params.get('hen'), length=params.get('phut');
 if(!ROOMS.includes(room)||!/^\d{13}$/.test(time??'')||!['1','3','5'].includes(length))return null;
 const start=Number(time), minutes=Number(length);
 if(start<now-day||start>now+day)return null;
 return {room,start,minutes};
}

export function gatheringFrame(gathering,now){
 const elapsed=now-gathering.start;
 const duration=gathering.minutes*minute;
 if(elapsed<0)return {stage:'waiting',seconds:Math.ceil(-elapsed/1000)};
 if(elapsed>=duration)return {stage:'ended',seconds:0};
 return {stage:'active',seconds:Math.ceil((duration-elapsed)/1000),inhale:elapsed%10000<4000};
}

export function regularGathering(room,now){
 const start=Math.floor(now/(15*minute))*15*minute;
 return {room,start:now<start+5*minute?start:start+15*minute,minutes:5};
}

export function gatheringLink(gathering){
 const url=new URL('/',location.origin);
 url.search=new URLSearchParams({room:gathering.room,hen:String(gathering.start),phut:String(gathering.minutes)});
 return url.href;
}

export function clockLabel(seconds){
 return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
}

export function gatheringCalendar(gathering,url,now){
 const stamp=t=>new Date(t).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
 const urlLine='URL:'+url;
 const foldedUrl=[urlLine.slice(0,75),...(urlLine.slice(75).match(/.{1,74}/g)??[]).map(part=>' '+part)].join('\r\n');
 return [
  'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Hien An//Hen Thien//VI','CALSCALE:GREGORIAN',
  'BEGIN:VEVENT',
  'UID:'+gathering.room+'-'+gathering.start+'-'+gathering.minutes+'@'+new URL(url).hostname,
  'DTSTAMP:'+stamp(now),'DTSTART:'+stamp(gathering.start),
  'DTEND:'+stamp(gathering.start+gathering.minutes*minute),
  'SUMMARY:Hẹn thiền tại Hiên An','DESCRIPTION:Mở đường dẫn để vào cùng sân.',
  foldedUrl,'END:VEVENT','END:VCALENDAR',''
 ].join('\r\n');
}
