import {hitsScenery} from './solid-shapes.js?v=hoi-rong-1';
import {rearHallHeight} from './precinct-layout.js?v=precinct-1';
import {HALL,HALL_DECK,HALL_SEATS,HALL_GARDEN_SEATS,onHallDeck} from './hall-layout.js?v=hall-200';
import {PARKED_CARS} from './parking-layout.js';
import {MAX_OUTFIT} from './fair-catalog.js?v=hoi-rong-1';
// Canonical, shared geometry and allowed fast-travel points. Metres, front +Z.
export const ROOMS=['hien-an-01','hien-an-02','hien-an-03'];
export const CAPACITY=200;
export const GREETING_WINDOW_MS=12000;
export const GREETING_LIMIT=12;
export const WORLD={minX:-156,maxX:156,minZ:-195,maxZ:130};
export {HALL,HALL_DECK};
export const BELL_PAVILION={x:-36,z:-6};
export const FESTIVAL_COURT={width:128,depth:66,z:63};
export const LOTUS_POND={halfWidth:36,northBank:14,southBank:30,bridgeHalfWidth:2.5};
export function lotusBridgeRise(z){
 const span=LOTUS_POND.southBank-LOTUS_POND.northBank;
 const progress=Math.max(0,Math.min(1,(z-LOTUS_POND.northBank)/span));
 return Math.sin(progress*Math.PI)*1.15;
}
export const ZONES={
 temple:{name:'Chánh điện',point:[0,-6.4],camera:[8,7.5,46],look:[0,4.7,-18],action:'prostrate',description:'Gian hành lễ có 200 bồ đoàn, với lối đi giữa và hai bên.'},
 festival:{name:'Sân hội',point:[0,58],camera:[33,15,92],look:[0,4,52],action:'festival',description:'Một khoảng sân lớn, những lối đi và nhịp sinh hoạt chung.'},
 market:{name:'Phố hội tam quan',point:[0,87],camera:[3.1,6.1,104.2],look:[0,2.5,79],action:'market',description:'Xe hàng rong, sạp vé số, bàn xem quẻ và những buổi diễn giữa phố.'},
 'fair-stage':{name:'Sân diễn',point:[5.7,65],camera:[-1,3.8,73],look:[8,2.1,65],action:'fair-stage'},
 oracle:{name:'Nhà gieo quẻ',point:[-49,-5],camera:[-35,5.6,9],look:[-49,2.8,-15],action:'oracle',description:'Gieo ba đồng xu, xem quẻ và giữ một điều để chiêm nghiệm.'},
 offerings:{name:'Nhà đặt lễ',point:[49,-5],camera:[64,5.5,9],look:[49,2.7,-15],action:'offerings',description:'Chọn lễ tượng trưng, tạo phiếu demo và xem lại phiếu của bạn.'},
 tea:{name:'Hiên trà',point:[-53,47],camera:[-36,6.5,66],look:[-53,2,43],action:'tea',description:'Ngồi bên bàn trà, nghe âm thanh của vườn.'},
 meditation:{name:'Vườn thiền',point:[53,48],camera:[70,9,68],look:[53,1.7,44],action:'gathering',description:'Thiền theo nhịp thở hoặc cùng dừng lại vào mỗi15phút.'},
 memorial:{name:'Hiên tưởng niệm',point:[0,-56],camera:[16,8,-37],look:[0,3,-68],action:'memorial',description:'Một ngọn đèn và một lời nhớ, riêng trong trình duyệt này.'},
 'arhat-east':{name:'Hành lang La Hán Đông',point:[82,-76],camera:[80,4.2,-65],look:[88,1.9,-90],description:'18 pho La Hán đá dưới mái ngói, nhìn về lối đi phía trong.'},
 'arhat-west':{name:'Hành lang La Hán Tây',point:[-82,-76],camera:[-80,4.2,-65],look:[-88,1.9,-90],description:'18 pho La Hán với các dáng thiền, cầm tích trượng và lần tràng hạt.'},
 'compassion':{name:'Sân Quan Âm',point:[52,-102],camera:[64,8.2,-90],look:[52,5.1,-116],description:'Pho Quan Âm đá trắng trên đài sen, giữa một sân chiêm bái mở.'},
 'tam-the':{name:'Điện Tam Thế',point:[0,-149],camera:[4,3.25,-127],look:[0,4.8,-168],description:'Ba pho tượng đồng ngồi trên đài sen ở cuối trục hành lễ.'},
 bell:{name:'Gác chuông',point:[BELL_PAVILION.x+4.5,-3],camera:[-23,7,9],look:[BELL_PAVILION.x,3,BELL_PAVILION.z],action:'bell'},
 pond:{name:'Hồ sen',point:[13,12],camera:[16,8,12],look:[16,0,22],action:'lantern',description:'Ngắm đàn cá koi bơi dưới mặt nước giữa những cụm sen.'},
 parking:{name:'Bãi đỗ xe',point:[76,55.6],camera:[61,12.5,63],look:[83,1,51],description:`Khu đỗ xe bên hông chùa có ${PARKED_CARS.length} xe, từ sedan, SUV đến limousine và siêu xe.`},
 tree:{name:'Vườn cây',point:[33,5],camera:[41,10,17],look:[34,3,0],action:'breathe'},
 gate:{name:'Tam quan',point:[0,112],camera:[31,18,139],look:[0,5,114],action:'map'}
};
export const SEATS=[...HALL_SEATS,...HALL_GARDEN_SEATS,{id:'bodhi',x:31.5,z:3},...Array.from({length:24},(_,i)=>({id:`zen:${i}`,x:45+(i%6)*3.2,z:39+Math.floor(i/6)*3.2})),...[-57,-53,-49].map((x,i)=>({id:`tea:${i}`,x,z:47}))];
export function validPosition(x,z){
 if(!Number.isFinite(x)||!Number.isFinite(z)||x<WORLD.minX||x>WORLD.maxX||z<WORLD.minZ||z>WORLD.maxZ)return false;
 if(z>=LOTUS_POND.northBank&&z<=LOTUS_POND.southBank&&Math.abs(x)<LOTUS_POND.halfWidth)return Math.abs(x)<LOTUS_POND.bridgeHalfWidth-.16;
 if(hitsScenery(x,z))return false;
 if(Math.abs(x-BELL_PAVILION.x)<3.5&&Math.abs(z-BELL_PAVILION.z)<3.5)return false;
 if(Math.abs(x)<7&&z< -68&&z> -82)return false;
 if([-59,-53,-47].some(cx=>Math.hypot(x-cx,z-43)<1.12))return false;
 if(Math.hypot(x,z+84)<7.2)return false;
 if(Math.abs(Math.abs(x)-53)<14.5&&z>-60.5&&z<-41.5)return false;
 for(const cx of [-49,49]){if(Math.abs(x-cx)<9&&z>-17.9&&z<-15.1)return false;if(Math.abs(x-cx)<11.6&&z>-23.0&&z<-22.05)return false;if(Math.abs(Math.abs(x-cx)-11)<.5&&z>-22.5&&z<-5.7)return false;}
 return true;
}
export function groundHeight(x,z){if(z>=LOTUS_POND.northBank&&z<=LOTUS_POND.southBank&&Math.abs(x)<LOTUS_POND.bridgeHalfWidth+.2)return .22+lotusBridgeRise(z);if(onHallDeck(x,z))return HALL_DECK.height;
 if(z>HALL_DECK.front&&z<HALL.stairFront&&Math.abs(x)<HALL.stairHalfWidth){
  return .15+(HALL.stairFront-z)/(HALL.stairFront-HALL_DECK.front)*(HALL_DECK.height-.15);
 }
 if(Math.abs(Math.abs(x)-49)<9&&z<= -5&&z> -23)return .65;if(Math.abs(Math.abs(x)-49)<4.5&&z>-5&&z<-2)return .15+(-z-2)/3*.5;if(x>-64.5&&x<-41.5&&z>33.5&&z<52.5)return .32;if(Math.abs(x)<14&&z< -60&&z> -84)return .65;return rearHallHeight(x,z)??.15}
export function nearestZone(x,z){if(onHallDeck(x,z))return {id:'temple',name:ZONES.temple.name,distance:Math.hypot(x,z-ZONES.temple.point[1])};const nearest=Object.entries(ZONES).reduce((best,[id,p])=>Math.hypot(x-p.point[0],z-p.point[1])<best.distance?{id,name:p.name,distance:Math.hypot(x-p.point[0],z-p.point[1])}:best,{id:'temple',name:ZONES.temple.name,distance:Infinity});if(Math.abs(x)<32&&z>-24&&z<9.5&&nearest.id==='pond')return {id:'temple',name:ZONES.temple.name,distance:Math.hypot(x,z+8)};return nearest}
export function normalizeAppearance(value){const fallback={profile:0,hair:0,outfit:0,palette:0};if(!value||typeof value!=='object')return fallback;return Object.fromEntries(Object.entries({profile:7,hair:5,outfit:MAX_OUTFIT,palette:7}).map(([k,max])=>[k,Number.isInteger(value[k])&&value[k]>=0&&value[k]<=max?value[k]:fallback[k]]))}
