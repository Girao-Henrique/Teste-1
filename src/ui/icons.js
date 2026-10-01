/** Paradise? — desenhos originais em uma grade de 24 × 24 pixels.
 * Esta é a fonte editável do atlas. Sem emojis, fontes de símbolos ou bibliotecas.
 */
const P={ink:'#253c4b',shadow:'#42556a',deep:'#286564',jade:'#428e7d',mint:'#81c9a4',pale:'#c8e9ca',cream:'#fff0cf',paper:'#ecd5a8',gold:'#efbf70',copper:'#b88361',wood:'#946148',soil:'#604c49',silver:'#bad5cf',blue:'#72bccc',lilac:'#baadd7',violet:'#8073a6',rose:'#e9a899',amber:'#e2a965',white:'#fff8e8'};
class Pixels{
 constructor(){this.grid=Array.from({length:24},()=>Array(24).fill(null));}
 pixel(x,y,col){x=Math.round(x);y=Math.round(y);if(x>=0&&x<24&&y>=0&&y<24)this.grid[y][x]=P[col]||col;}
 rect(x,y,w,h,col){for(let yy=Math.round(y);yy<Math.round(y+h);yy++)for(let xx=Math.round(x);xx<Math.round(x+w);xx++)this.pixel(xx,yy,col);}
 line(x1,y1,x2,y2,col,w=1){x1=Math.round(x1);y1=Math.round(y1);x2=Math.round(x2);y2=Math.round(y2);const dx=Math.abs(x2-x1),sx=x1<x2?1:-1,dy=-Math.abs(y2-y1),sy=y1<y2?1:-1;let err=dx+dy;for(let i=0;i<100;i++){this.rect(x1-Math.floor(w/2),y1-Math.floor(w/2),w,w,col);if(x1===x2&&y1===y2)break;const e=2*err;if(e>=dy){err+=dy;x1+=sx;}if(e<=dx){err+=dx;y1+=sy;}}}
 poly(points,col){for(let y=Math.ceil(Math.min(...points.map(p=>p[1])));y<=Math.max(...points.map(p=>p[1]));y++){const a=[];for(let i=0;i<points.length;i++){const[x1,y1]=points[i],[x2,y2]=points[(i+1)%points.length];if((y1<=y&&y2>y)||(y2<=y&&y1>y))a.push(x1+(y-y1)/(y2-y1)*(x2-x1));}a.sort((a,b)=>a-b);for(let i=0;i<a.length;i+=2)this.rect(Math.ceil(a[i]),y,Math.floor(a[i+1])-Math.ceil(a[i])+1,1,col);}}
 oval(x,y,rx,ry,col){for(let yy=-ry;yy<=ry;yy++){const w=Math.floor(rx*Math.sqrt(Math.max(0,1-yy*yy/(ry*ry))));this.rect(x-w,y+yy,w*2+1,1,col);}}
 outline(){const base=this.grid.map(row=>[...row]);for(let y=0;y<24;y++)for(let x=0;x<24;x++)if(base[y][x])for(const[dx,dy]of[[-1,0],[1,0],[0,-1],[0,1]]){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<24&&yy>=0&&yy<24&&!base[yy][xx])this.grid[yy][xx]=P.ink;}}
 paths(){const colors=new Map();this.grid.forEach((row,y)=>{for(let x=0;x<24;){const col=row[x];let n=1;while(x+n<24&&row[x+n]===col)n++;if(col)colors.set(col,(colors.get(col)||'')+`M${x} ${y}h${n}v1h-${n}z`);x+=n;}});return[...colors].map(([col,d])=>`<path fill="${col}" d="${d}"/>`).join('');}
}
function leaf(p,x,y,flip=false,col='jade'){const s=flip?-1:1;p.poly([[x,y],[x+s*6,y-7],[x+s*8,y-7],[x+s*7,y-2],[x+s*2,y+1]],col);p.line(x+s,y,x+s*6,y-5,'mint');}
function sparkle(p,x,y,col='cream',r=3){p.line(x-r,y,x+r,y,col);p.line(x,y-r,x,y+r,col);p.rect(x-1,y-1,3,3,col);}
function crystal(p,x,y,r=4,col='blue'){p.poly([[x,y-r*2],[x+r,y-r],[x+r-1,y+r],[x,y+r+2],[x-r,y+r],[x-r,y-r]],col);p.poly([[x,y-r*2],[x+1,y],[x,y+r+2],[x-r,y+r],[x-r,y-r]],'pale');p.line(x,y-r*2,x,y+r+1,'cream');}
function bottle(p,acid=false){p.rect(9,3,6,3,'wood');p.rect(9,3,6,1,'paper');p.rect(10,6,4,4,'silver');p.poly([[9,9],[7,11],[6,15],[7,19],[10,21],[15,21],[18,18],[18,13],[15,9]],'silver');p.poly([[8,13],[16,13],[17,17],[15,20],[9,20],[7,17]],acid?'mint':'jade');p.line(8,12,7,16,'cream');p.rect(8,18,1,1,'cream');if(acid){p.rect(10,15,1,1,'cream');p.rect(14,18,1,1,'cream');sparkle(p,20,7,'gold',2);}else{leaf(p,11,17,false,'mint');p.line(10,18,13,14,'cream');}}
function shaft(p,x1,y1,x2,y2){p.line(x1,y1,x2,y2,'wood',3);p.line(x1,y1,x2,y2,'copper');p.rect(x1-1,y1,3,2,'gold');}
const DRAW={
 wood:p=>{p.poly([[3,16],[15,5],[20,8],[8,20]],'wood');p.poly([[3,16],[15,5],[17,7],[6,18]],'copper');p.line(6,16,17,7,'paper');p.poly([[6,20],[18,10],[21,12],[10,22]],'wood');p.line(9,20,20,12,'copper');p.oval(6,18,3,2,'paper');p.rect(5,17,2,2,'copper');p.rect(6,18,1,1,'wood');p.oval(9,21,2,1,'gold');leaf(p,16,8);},
 stone:p=>{p.poly([[3,12],[6,7],[13,4],[20,9],[21,16],[17,20],[7,20],[2,17]],'shadow');p.poly([[3,12],[6,7],[13,4],[18,8],[17,14],[9,17],[3,16]],'silver');p.poly([[7,8],[13,5],[16,8],[11,11],[5,11]],'cream');p.line(11,12,17,9,'blue');p.line(11,12,9,17,'deep');p.rect(15,16,2,1,'silver');},
 fiber:p=>{for(const[x,y,f]of[[7,15,false],[13,13,false],[15,18,true]]){p.line(x,y,x+1,4,'jade');leaf(p,x,y-2,f);leaf(p,x,y-6,!f,'mint');}p.rect(6,17,11,3,'gold');p.rect(6,17,11,1,'cream');p.line(11,19,8,22,'copper');p.line(12,19,15,22,'copper');},
 fruit:p=>{p.oval(11,14,8,7,'copper');p.oval(10,13,7,6,'rose');p.oval(7,12,3,4,'amber');p.line(14,9,13,18,'copper');p.rect(5,10,2,3,'cream');p.line(11,8,12,4,'wood');leaf(p,12,7);},
 water:p=>{p.poly([[12,2],[16,8],[19,13],[19,17],[16,21],[8,21],[5,17],[5,13],[8,8]],'deep');p.poly([[12,3],[15,9],[17,13],[17,17],[14,20],[8,19],[6,16],[7,12]],'blue');p.poly([[12,4],[12,10],[9,13],[8,16],[6,15],[8,10]],'pale');p.line(7,17,10,19,'cream');p.rect(13,17,2,2,'silver');},
 herb:p=>{p.line(10,21,13,7,'deep',2);leaf(p,11,19,true);leaf(p,12,15);leaf(p,12,12,true,'mint');leaf(p,13,8,false,'pale');p.rect(8,20,6,2,'copper');p.rect(9,20,4,1,'gold');},
 ore:p=>{p.poly([[3,13],[7,7],[15,5],[20,10],[21,17],[16,21],[7,21],[2,17]],'shadow');p.poly([[5,12],[8,7],[15,6],[18,10],[14,13]],'silver');p.poly([[8,15],[12,10],[16,12],[14,17],[10,19]],'copper');p.poly([[9,14],[12,11],[14,12],[12,16]],'gold');p.rect(12,12,1,2,'cream');p.rect(17,17,2,2,'gold');},
 crystal:p=>{crystal(p,12,12,5);crystal(p,5,17,2,'lilac');crystal(p,19,16,2,'mint');sparkle(p,20,5,'cream',2);},
 essence:p=>{p.oval(12,13,7,8,'violet');p.oval(11,12,5,6,'lilac');p.poly([[12,5],[15,11],[12,19],[9,12]],'blue');p.line(12,8,12,16,'cream');sparkle(p,5,5,'gold',2);sparkle(p,20,18,'gold',2);},
 food:p=>{p.oval(12,17,10,4,'deep');p.oval(12,15,9,4,'jade');p.oval(12,13,7,5,'copper');p.oval(11,11,7,4,'gold');p.line(6,12,10,9,'cream',2);p.line(12,12,15,9,'cream',2);leaf(p,10,18,false,'mint');p.line(4,18,8,20,'pale');},
 heal:p=>bottle(p),acid:p=>bottle(p,true),
 camp:p=>{p.poly([[12,4],[22,19],[3,19]],'copper');p.poly([[12,4],[13,18],[3,18]],'jade');p.poly([[12,5],[20,17],[14,17]],'gold');p.poly([[12,9],[16,18],[8,18]],'deep');p.line(12,4,3,18,'mint');p.line(12,4,22,19,'cream');p.line(3,19,2,21,'wood');p.line(22,19,21,21,'wood');p.rect(10,3,4,1,'gold');},
 axe_tool:p=>{shaft(p,6,21,15,7);p.poly([[12,6],[18,3],[21,5],[20,10],[15,13],[13,11]],'silver');p.line(17,4,21,5,'cream');p.line(20,6,19,9,'blue');p.rect(12,9,3,2,'gold');p.line(7,18,9,15,'deep');},
 pickaxe:p=>{shaft(p,7,21,13,6);p.poly([[4,7],[8,3],[14,3],[20,6],[21,10],[18,8],[13,6],[7,6]],'silver');p.line(8,4,14,4,'cream');p.line(16,5,19,7,'blue');p.rect(11,6,4,3,'gold');},
 sword:p=>{shaft(p,4,21,9,16);p.poly([[9,15],[17,3],[21,2],[21,6],[11,17]],'silver');p.poly([[10,14],[18,3],[20,3],[10,16]],'cream');p.line(12,15,20,5,'blue');p.line(6,13,13,19,'gold',3);p.rect(8,15,3,3,'jade');p.rect(3,20,3,2,'gold');},
 axe:p=>{shaft(p,5,21,15,6);p.poly([[12,6],[14,2],[20,4],[22,9],[18,14],[16,13],[13,9],[9,10],[6,8],[8,4]],'silver');p.poly([[14,3],[19,5],[20,8],[18,11],[16,10]],'cream');p.line(7,7,9,4,'blue');p.line(17,13,21,8,'blue');p.rect(11,7,6,2,'gold');},
 spear:p=>{shaft(p,4,21,16,6);p.poly([[15,6],[21,1],[21,7],[18,11],[14,10]],'blue');p.poly([[16,6],[20,2],[18,8],[15,9]],'cream');p.line(14,8,18,11,'gold',2);},
 hammer:p=>{shaft(p,5,21,14,7);p.poly([[10,3],[16,2],[22,7],[21,12],[16,14],[8,9],[7,6]],'shadow');p.poly([[10,3],[15,3],[20,7],[17,9],[9,6]],'silver');p.poly([[9,6],[17,10],[16,13],[8,9]],'blue');p.line(11,4,17,6,'cream');p.rect(14,8,2,2,'gold');},
 daggers:p=>{for(const dx of[0,10]){shaft(p,4+dx,20,7+dx,15);p.poly([[6+dx,14],[8+dx,5],[11+dx,2],[12+dx,7],[9+dx,16]],'jade');p.poly([[7+dx,14],[10+dx,4],[10+dx,9]],'pale');p.line(4+dx,14,10+dx,17,'gold',2);}},
 bow:p=>{p.poly([[8,2],[14,4],[18,9],[19,12],[18,16],[14,20],[8,22],[9,18],[13,16],[15,12],[12,7],[9,6]],'wood');p.line(9,3,9,21,'cream');p.line(10,4,14,7,'gold');p.line(16,10,16,14,'gold');p.line(11,19,15,16,'gold');p.line(3,12,21,12,'paper');p.poly([[18,10],[22,12],[18,14]],'silver');p.line(4,10,6,12,'jade');p.line(4,14,6,12,'jade');},
 crossbow:p=>{shaft(p,7,21,16,7);p.poly([[4,7],[8,4],[13,7],[18,11],[21,17],[17,19],[17,15],[13,11],[8,8]],'jade');p.line(5,7,19,17,'gold');p.line(7,5,19,16,'mint');p.line(7,8,17,17,'paper');p.line(11,15,20,3,'silver',2);p.poly([[19,3],[22,2],[21,6]],'lilac');p.rect(12,10,3,3,'lilac');},
 aurora_pollen:p=>{p.line(12,20,12,10,'jade');for(const[x,y]of[[12,6],[7,9],[17,9],[9,14],[15,14]])p.oval(x,y,3,3,'gold');p.oval(12,10,3,3,'copper');p.rect(11,9,2,2,'cream');leaf(p,12,20);sparkle(p,4,3,'cream',2);},
 eternal_sap:p=>{p.poly([[12,3],[16,8],[18,14],[17,18],[12,21],[7,18],[6,14],[9,8]],'copper');p.poly([[12,5],[15,10],[16,15],[12,19],[8,16],[8,13]],'amber');p.line(11,8,9,13,'cream',2);leaf(p,17,9);},
 golden_seed:p=>{p.line(11,21,12,5,'copper');for(const[x,y]of[[9,17],[14,14],[9,11],[14,8]]){p.oval(x,y,3,2,'gold');p.rect(x-1,y-1,2,1,'cream');}p.poly([[11,7],[12,2],[14,4],[13,8]],'gold');leaf(p,9,20,true);},
 pearl_salt:p=>{p.poly([[3,16],[7,9],[12,7],[20,13],[21,18],[13,21],[5,20]],'blue');p.poly([[4,16],[7,10],[12,8],[18,13],[14,18],[6,19]],'silver');for(const[x,y]of[[8,13],[12,11],[16,15],[10,17]]){p.rect(x,y,3,3,'cream');p.rect(x+2,y+2,1,1,'gold');}sparkle(p,20,4,'cream',2);},
 white_limestone:p=>{p.poly([[3,15],[7,7],[14,5],[20,10],[21,17],[16,21],[6,20]],'silver');p.poly([[4,14],[8,8],[14,6],[19,10],[14,15],[7,17]],'cream');p.line(10,12,14,9,'paper');p.line(16,14,19,12,'blue');p.rect(4,21,2,1,'paper');},
 cloud_dew:p=>{leaf(p,6,19,false,'mint');p.poly([[16,3],[19,7],[21,12],[20,15],[16,17],[13,15],[12,11]],'blue');p.poly([[16,4],[16,8],[14,12],[14,14],[13,12],[14,8]],'cream');p.rect(17,13,2,1,'pale');p.line(4,21,13,12,'jade');},
 prism_spore:p=>{p.rect(10,15,5,7,'cream');p.poly([[3,13],[6,7],[11,3],[16,6],[21,12],[19,15],[5,15]],'violet');p.poly([[4,12],[7,8],[11,4],[13,8],[11,13]],'lilac');p.poly([[13,8],[16,7],[20,12],[16,13]],'blue');p.rect(8,9,2,1,'cream');p.rect(16,11,2,1,'pale');sparkle(p,20,4,'gold',2);},
 sky_feather:p=>{p.poly([[4,20],[6,9],[14,3],[20,2],[20,8],[16,14],[8,19]],'blue');p.poly([[5,17],[7,9],[14,4],[18,3],[15,8],[10,12]],'cream');p.line(4,21,18,5,'gold');p.line(9,15,15,13,'silver');p.line(12,11,18,8,'pale');},
 light_nectar:p=>{bottle(p,true);p.oval(12,16,4,3,'gold');p.rect(10,14,2,2,'cream');p.rect(10,5,4,2,'gold');sparkle(p,4,8,'cream',2);},
 map:p=>{p.poly([[3,5],[9,3],[15,5],[21,3],[21,19],[15,21],[9,19],[3,21]],'paper');p.poly([[4,6],[9,4],[9,18],[4,20]],'cream');p.poly([[15,6],[20,4],[20,18],[15,20]],'cream');p.line(9,4,9,19,'copper');p.line(15,6,15,20,'copper');p.line(5,15,11,11,'jade',2);p.line(11,11,18,13,'jade',2);p.line(5,9,8,11,'blue');sparkle(p,17,16,'gold',2);},
 bag:p=>{p.rect(7,3,10,4,'wood');p.rect(9,4,6,2,'paper');p.poly([[6,7],[18,7],[20,11],[20,20],[17,22],[7,22],[4,19],[4,11]],'wood');p.rect(5,9,14,11,'copper');p.rect(6,8,12,5,'paper');p.rect(7,8,10,3,'cream');p.rect(6,16,12,5,'jade');p.rect(7,16,10,2,'mint');p.rect(10,11,4,5,'gold');p.rect(11,12,2,2,'deep');},
 pause:p=>{for(const x of[6,15]){p.rect(x,4,4,16,'gold');p.rect(x,5,1,13,'cream');p.rect(x+2,7,2,11,'copper');p.rect(x-1,3,6,2,'paper');p.rect(x-1,19,6,2,'paper');}},
 health:p=>{p.poly([[4,5],[8,4],[12,8],[16,4],[20,5],[22,9],[21,13],[12,22],[3,13],[2,9]],'copper');p.poly([[4,6],[8,5],[12,9],[16,5],[20,6],[21,10],[18,14],[12,19],[5,13],[3,9]],'rose');p.rect(5,7,3,2,'cream');},
 sleep:p=>{p.oval(12,11,8,9,'gold');p.oval(16,8,7,8,'ink');p.line(6,14,8,17,'cream');sparkle(p,18,17,'cream',2);},
 stamina:p=>{p.poly([[14,2],[5,13],[11,13],[8,22],[20,9],[14,9]],'gold');p.poly([[14,3],[7,12],[13,12],[11,18],[17,11],[12,11]],'cream');},
 sun:p=>{p.oval(12,12,5,5,'gold');p.oval(11,11,3,3,'cream');for(let i=0;i<8;i++){const a=i*Math.PI/4;p.line(12+Math.cos(a)*8,12+Math.sin(a)*8,12+Math.cos(a)*10,12+Math.sin(a)*10,'gold');}},
 settings:p=>{p.oval(12,12,8,8,'silver');for(let i=0;i<8;i++){const a=i*Math.PI/4;p.rect(11+Math.cos(a)*9,11+Math.sin(a)*9,3,3,'gold');}p.oval(12,12,5,5,'deep');p.oval(12,12,2,2,'cream');p.rect(8,6,3,1,'cream');},
 fullscreen:p=>{for(const[x,y,sx,sy]of[[3,3,1,1],[20,3,-1,1],[3,20,1,-1],[20,20,-1,-1]]){p.line(x,y,x+sx*6,y,'cream',2);p.line(x,y,x,y+sy*6,'cream',2);}p.rect(9,9,6,6,'jade');p.rect(10,10,4,4,'mint');},
 electric:p=>{p.poly([[14,2],[5,13],[11,13],[8,22],[20,9],[14,9]],'blue');p.line(14,4,8,11,'cream');p.line(17,11,11,18,'pale');sparkle(p,3,4,'gold',2);},
 target:p=>{for(let i=0;i<4;i++){const a=i*Math.PI/2;p.line(12+Math.cos(a)*7,12+Math.sin(a)*7,12+Math.cos(a)*10,12+Math.sin(a)*10,'gold',2);}for(const[x1,y1,x2,y2]of[[6,6,18,6],[18,6,18,18],[18,18,6,18],[6,18,6,6]])p.line(x1,y1,x2,y2,'cream');p.rect(10,10,4,4,'jade');p.rect(11,11,2,2,'mint');},
 save:p=>{p.poly([[4,3],[18,3],[21,6],[21,21],[3,21],[3,4]],'jade');p.rect(6,3,10,7,'paper');p.rect(12,4,2,4,'gold');p.rect(6,13,12,8,'cream');p.rect(8,15,8,1,'copper');p.rect(8,18,6,1,'copper');},
 journal:p=>{p.rect(4,3,15,18,'wood');p.rect(5,3,3,18,'gold');p.rect(9,4,11,16,'jade');p.rect(10,5,9,14,'deep');sparkle(p,14,12,'cream',3);p.rect(18,2,2,10,'rose');},
 close:p=>{p.line(5,5,18,18,'gold',3);p.line(18,5,5,18,'gold',3);p.line(6,5,18,17,'cream');p.line(18,6,6,18,'cream');},
 play:p=>{p.poly([[7,3],[21,12],[7,21]],'jade');p.poly([[7,3],[19,11],[7,11]],'mint');p.line(8,5,17,11,'cream');},
 support:p=>{p.poly([[3,10],[12,2],[21,10]],'jade');p.line(3,10,12,3,'mint');p.rect(5,11,14,10,'paper');p.rect(5,11,14,2,'cream');p.rect(10,15,5,6,'deep');p.rect(7,15,2,3,'gold');p.rect(16,15,2,3,'gold');},
 lock:p=>{p.oval(12,8,5,6,'gold');p.oval(12,8,3,4,'ink');p.rect(5,10,14,11,'jade');p.rect(6,11,12,2,'mint');p.oval(12,15,2,2,'cream');p.rect(11,16,2,3,'cream');},
 volume:p=>{p.poly([[3,9],[7,9],[13,3],[13,21],[7,15],[3,15]],'jade');p.line(11,6,11,18,'mint');for(const[x1,y1,x2,y2]of[[16,8,18,10],[18,10,18,14],[18,14,16,16]])p.line(x1,y1,x2,y2,'gold');for(const[x1,y1,x2,y2]of[[19,4,22,8],[22,8,22,16],[22,16,19,20]])p.line(x1,y1,x2,y2,'cream');},
 download:p=>{p.rect(10,3,4,10,'mint');p.poly([[5,11],[18,11],[12,18]],'gold');p.line(10,4,10,11,'cream');p.rect(4,19,16,2,'jade');p.rect(4,17,2,4,'jade');p.rect(18,17,2,4,'jade');},
 dodge:p=>{p.poly([[5,3],[12,3],[14,9],[19,16],[17,21],[9,20],[4,15],[6,9]],'jade');p.line(7,4,11,4,'cream');p.rect(5,13,5,3,'mint');p.line(8,17,15,19,'gold');p.rect(2,6,3,1,'gold');p.rect(1,9,3,1,'gold');},
 default:p=>{sparkle(p,12,12,'gold',8);sparkle(p,12,12,'cream',5);p.rect(11,11,3,3,'white');leaf(p,7,20,true);leaf(p,17,20);},
};
DRAW.compass=p=>{p.oval(12,12,9,9,'gold');p.oval(12,12,7,7,'deep');p.oval(12,12,5,5,'jade');p.poly([[12,5],[15,13],[12,11],[9,13]],'cream');p.poly([[12,19],[9,12],[12,13],[15,12]],'copper');p.rect(11,11,3,3,'gold');};
DRAW.hand=p=>{p.rect(10,3,3,13,'cream');p.rect(7,7,3,9,'paper');p.rect(13,8,3,8,'paper');p.rect(16,10,3,7,'paper');p.poly([[4,12],[7,13],[10,17],[18,16],[16,21],[9,21],[5,17]],'copper');p.rect(9,15,8,5,'paper');p.line(10,20,15,20,'cream');};
DRAW.sprint=p=>{p.oval(14,5,3,3,'gold');p.line(12,10,17,12,'mint',3);p.line(12,10,9,15,'jade',3);p.line(10,14,15,17,'paper',3);p.line(15,17,18,21,'gold',2);p.line(9,15,5,20,'cream',2);p.line(7,11,9,9,'cream',2);p.rect(2,8,3,1,'gold');p.rect(1,12,3,1,'gold');};
DRAW.hunger=DRAW.food;DRAW.thirst=DRAW.water;DRAW.moon=DRAW.sleep;DRAW.day=DRAW.sun;DRAW.night=DRAW.sleep;DRAW.potion=DRAW.acid;DRAW.attack=DRAW.sword;DRAW.strong=DRAW.hammer;DRAW.charge=DRAW.hammer;DRAW.interact=DRAW.hand;
const ART=Object.fromEntries(Object.entries(DRAW).map(([id,draw])=>{const p=new Pixels();draw(p);p.outline();return[id,p.paths()];}));
export const iconIds=Object.freeze(Object.keys(ART));
/** SVG seguro para HTML. O nome acessível pertence ao botão ou item. */
export function icon(id){const key=Object.hasOwn(ART,id)?id:'default';return `<svg xmlns="http://www.w3.org/2000/svg" class="pixel-icon" data-icon="${key}" width="1.5em" height="1.5em" viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true" focusable="false" style="width:1.5em;height:1.5em;image-rendering:pixelated;vertical-align:middle;flex-shrink:0">${ART[key]}</svg>`;}
/** Atlas original, exportável sem depender de DOM ou bibliotecas de arte. */
export function iconSheet(){const columns=8,rows=Math.ceil(iconIds.length/columns);return `<svg xmlns="http://www.w3.org/2000/svg" width="${columns*32}" height="${rows*32}" viewBox="0 0 ${columns*32} ${rows*32}" shape-rendering="crispEdges"><title>Ícones originais de Paradise?</title>${iconIds.map((id,i)=>`<g id="${id}" transform="translate(${i%columns*32+4} ${Math.floor(i/columns)*32+4})"><title>${id}</title>${ART[id]}</g>`).join('')}</svg>`;}
