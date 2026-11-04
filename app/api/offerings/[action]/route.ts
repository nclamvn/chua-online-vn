import {env} from 'cloudflare:workers';
import {ROOMS} from '../../../../public/world-rules.js';
import {readJsonObject} from '../../../../lib/request-json';
type ReceiptRow = {id:string;kind:string;day:string;slot:number;status:string;room:string;created_at:number};
const kinds=['flowers','lotus','tea','memorial'];
const headers={'Content-Type':'application/json','Cache-Control':'no-store, private'};
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
async function hash(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('')}
function receipt(r:ReceiptRow){return {id:r.id,kind:r.kind,day:r.day,slot:r.slot,status:r.status,room:r.room,createdAt:r.created_at}}
export async function POST(request:Request,ctx:{params:Promise<{action:string}>}){
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return reply({error:'Nguồn yêu cầu không hợp lệ.'},403);
 const json=await readJsonObject(request);
 if(!json.ok)return reply({error:json.status===413?'Yêu cầu quá lớn.':'Dữ liệu không hợp lệ.'},json.status);
 const {body}=json;
 if(typeof body.ownerKey!=='string'||body.ownerKey.length<64||body.ownerKey.length>100)return reply({error:'Thiếu khóa phiếu của trình duyệt.'},401);
 const db=env.DB;if(!db)return reply({error:'Kho phiếu chưa sẵn sàng.'},503);
 const owner=await hash(body.ownerKey),{action}=await ctx.params,now=Date.now();
 try{
 if(action==='list'){const rows=await db.prepare('SELECT * FROM offering_receipts WHERE owner_hash=? ORDER BY created_at DESC LIMIT 30').bind(owner).all<ReceiptRow>();return reply({receipts:rows.results.map(receipt)})}
 if(action==='cancel'){if(typeof body.id!=='string')return reply({error:'Mã phiếu không hợp lệ.'},400);const row=await db.prepare("UPDATE offering_receipts SET status='cancelled',updated_at=? WHERE id=? AND owner_hash=? RETURNING *").bind(now,body.id,owner).first<ReceiptRow>();if(!row)return reply({error:'Không tìm thấy phiếu của bạn.'},404);return reply({receipt:receipt(row)})}
 if(action!=='create')return reply({error:'Thao tác không hợp lệ.'},404);
 if(typeof body.kind!=='string'||!kinds.includes(body.kind)||typeof body.room!=='string'||!ROOMS.includes(body.room)||typeof body.slot!=='number'||!Number.isInteger(body.slot)||body.slot<0||body.slot>3||typeof body.requestId!=='string'||!/^[\da-f-]{36}$/i.test(body.requestId))return reply({error:'Chọn loại lễ, sân và khung giờ hợp lệ.'},400);
 if(typeof body.day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(body.day))return reply({error:'Chọn ngày hợp lệ.'},400);
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(now),dayTime=Date.parse(body.day+'T00:00:00Z');
 if(!Number.isFinite(dayTime)||new Date(dayTime).toISOString().slice(0,10)!==body.day||body.day<today||dayTime-Date.parse(today)>90*86400000)return reply({error:'Chọn ngày từ hôm nay đến 90 ngày tới.'},400);
 const existing=await db.prepare('SELECT * FROM offering_receipts WHERE request_id=? AND owner_hash=?').bind(body.requestId,owner).first<ReceiptRow>();if(existing)return reply({receipt:receipt(existing),replayed:true});
 const id=crypto.randomUUID();const inserted=await db.prepare("INSERT INTO offering_receipts(id,owner_hash,request_id,room,kind,day,slot,status,created_at,updated_at) SELECT ?,?,?,?,?,?,?,'saved_demo',?,? WHERE (SELECT COUNT(*) FROM offering_receipts WHERE owner_hash=? AND day=? AND status='saved_demo')<5 ON CONFLICT(request_id) DO NOTHING RETURNING *").bind(id,owner,body.requestId,body.room,body.kind,body.day,body.slot,now,now,owner,body.day).first<ReceiptRow>();
 if(!inserted){const replay=await db.prepare('SELECT * FROM offering_receipts WHERE request_id=? AND owner_hash=?').bind(body.requestId,owner).first<ReceiptRow>();if(replay)return reply({receipt:receipt(replay),replayed:true});return reply({error:'Bạn đã có 5 phiếu demo cho ngày này. Có thể hủy phiếu cũ để đổi lựa chọn.'},409);}
 return reply({receipt:receipt(inserted)},201);
 }catch(error){console.error('Offering receipt request failed',error);return reply({error:'Chưa lưu được phiếu. Hãy thử lại với cùng lựa chọn.'},503)}
}
