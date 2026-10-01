import {BIOMES} from '../data/content.js';
import {TILE} from '../world/world.js';
const ink='#2c5255',paper='#e9dfbd',gold='#bf9455';
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));};
function star(c,x,y,color,size=3){rect(c,x-size,y,size*2+1,1,color);rect(c,x,y-size,1,size*2+1,color);rect(c,x-1,y-1,3,3,color);}
/** Carta original com relevo, limites descobertos e marcadores desenhados em pixels. */
export function drawRegionMap(c,world,state,width=384,height=288){
 c.imageSmoothingEnabled=false;
 const p=BIOMES[world.biome].palette,pad=14,scale=Math.min((width-pad*2)/world.width,(height-pad*2)/world.height);
 const ox=Math.round((width-world.width*scale)/2),oy=Math.round((height-world.height*scale)/2);
 const known=new Set(state.discoveries?.[world.biome]||[]),pois=new Set(state.pointsOfInterest?.[world.biome]||[]);
 const seen=(x,y)=>known.has(`${x},${y}`)||known.has(y*world.width+x)||Math.hypot(x*TILE-state.player.x,y*TILE-state.player.y)<120;
 rect(c,0,0,width,height,paper);
 for(let y=6;y<height-6;y+=12)for(let x=6;x<width-6;x+=12){rect(c,x,y,1,1,'#cec4a1');}
 rect(c,5,5,width-10,1,gold);rect(c,5,height-6,width-10,1,gold);rect(c,5,5,1,height-10,gold);rect(c,width-6,5,1,height-10,gold);
 for(let y=0;y<world.height;y++)for(let x=0;x<world.width;x++){
  if(!seen(x,y))continue;
  const t=world.tiles[y][x],px=ox+x*scale,py=oy+y*scale;
  const col=t===2?p.water:t===3?p.grassDark:t===0?p.grass:t===4?'#b79569':t===5?'#e5dcbb':p.path;
  rect(c,px,py,scale,scale,col);
  if(t===3&&world.tiles[y+1]?.[x]!==3)rect(c,px,py+scale-1,scale,1,ink);
  if(t===2&&(world.tiles[y-1]?.[x]!==2||world.tiles[y]?.[x-1]!==2))rect(c,px,py,scale,1,p.waterLight);
  if((x+y)%7===0&&t===0)rect(c,px+1,py+1,1,1,p.grassLight);
  if(!seen(x+1,y)||!seen(x,y+1))rect(c,px+scale-1,py+scale-1,1,1,'#b6af8e');
 }
 const at=o=>[ox+o.x/TILE*scale,oy+o.y/TILE*scale];
 const found=o=>seen(Math.floor(o.x/TILE),Math.floor(o.y/TILE))||pois.has(o.id);
 const marker=(o,kind)=>{
  const [x,y]=at(o);rect(c,x-4,y-4,9,9,ink);rect(c,x-3,y-3,7,7,paper);
  if(kind==='support'){rect(c,x-2,y,5,3,'#6e9e85');rect(c,x-3,y-2,7,1,gold);rect(c,x-1,y-3,3,1,gold);}
  else if(kind==='ingredient')star(c,x,y,'#59867e',2);
  else if(kind==='boss'){star(c,x,y,state.defeated?.includes(o.id)?'#73a293':'#c18c4b',2);}
  else{rect(c,x-2,y-2,5,5,'#93b09c');rect(c,x-1,y-1,3,3,gold);}
 };
 if(state.supports?.includes(world.biome)||found(world.support))marker(world.support,'support');
 for(const boss of world.bosses||[])if(found(boss))marker(boss,'boss');
 if(world.ingredient&&found(world.ingredient))marker(world.ingredient,'ingredient');
 if(world.landmark&&found(world.landmark))marker(world.landmark,'landmark');
 if(found(world.exit)){const[x,y]=at(world.exit);rect(c,x-2,y-4,5,9,ink);rect(c,x-1,y-3,3,7,gold);}
 const [x,y]=at(state.player);star(c,x,y,ink,5);star(c,x,y,'#fff5d6',4);rect(c,x-1,y-1,3,3,'#3d8994');
 // Rosa dos ventos e marcas das margens fazem parte da carta, sem ocupar a exploração.
 const cx=width-20,cy=22;star(c,cx,cy,ink,6);star(c,cx,cy,gold,4);rect(c,cx,cy-5,1,4,'#fff7dc');
 for(const[x,y]of[[9,9],[width-10,9],[9,height-10],[width-10,height-10]])star(c,x,y,gold,2);
}
