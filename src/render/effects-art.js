/** Paradise? — efeitos desenhados em pixels para a apresentação top-down.
 * Todos os desenhos preservam as regras do engine: as bordas de impactos,
 * investidas e feixes correspondem ao alcance real, sem áreas extras de dano.
 * Luz, pólen e água continuam acolhedores até o fim da jornada.
 */
const INK='#2b4055',CREAM='#fff0d0',GOLD='#efc580',MINT='#a7e4cf';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function rect(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function oval(c,x,y,rx,ry,col){c.fillStyle=col;rx=Math.max(1,Math.round(rx));ry=Math.max(1,Math.round(ry));for(let yy=-ry;yy<=ry;yy++){const span=Math.floor(rx*Math.sqrt(Math.max(0,1-yy*yy/(ry*ry))));c.fillRect(Math.round(x)-span,Math.round(y)+yy,span*2+1,1);}}
function poly(c,points,col){c.fillStyle=col;for(let y=Math.ceil(Math.min(...points.map(p=>p[1])));y<=Math.max(...points.map(p=>p[1]));y++){const xs=[];for(let i=0;i<points.length;i++){const[x1,y1]=points[i],[x2,y2]=points[(i+1)%points.length];if((y1<=y&&y2>y)||(y2<=y&&y1>y))xs.push(x1+(y-y1)/(y2-y1)*(x2-x1));}xs.sort((a,b)=>a-b);for(let i=0;i<xs.length;i+=2)c.fillRect(Math.ceil(xs[i]),y,Math.floor(xs[i+1])-Math.ceil(xs[i])+1,1);}}
function line(c,x1,y1,x2,y2,col,w=1){x1=Math.round(x1);y1=Math.round(y1);x2=Math.round(x2);y2=Math.round(y2);const dx=Math.abs(x2-x1),sx=x1<x2?1:-1,dy=-Math.abs(y2-y1),sy=y1<y2?1:-1;let err=dx+dy;for(let i=0;i<1600;i++){rect(c,x1-Math.floor(w/2),y1-Math.floor(w/2),w,w,col);if(x1===x2&&y1===y2)break;const e=2*err;if(e>=dy){err+=dy;x1+=sx;}if(e<=dx){err+=dx;y1+=sy;}}}
function ring(c,x,y,rx,ry,col,start=0,end=Math.PI*2,dash=0){const steps=Math.max(24,Math.ceil((rx+ry)*3*(end-start)/(Math.PI*2)));let last;for(let i=0;i<=steps;i++){const a=start+(end-start)*i/steps,p=[Math.round(x+Math.cos(a)*rx),Math.round(y+Math.sin(a)*ry)];if(last&&(!dash||Math.floor(i/dash)%2===0))line(c,last[0],last[1],p[0],p[1],col);last=p;}}
function star(c,x,y,r,col){line(c,x-r,y,x+r,y,col);line(c,x,y-r,x,y+r,col);rect(c,x-1,y-1,3,3,col);}
function arrow(c,x,y,a,col,size=4){const dx=Math.cos(a),dy=Math.sin(a);line(c,x-dx*size-dy*size*.7,y-dy*size+dx*size*.7,x,y,col);line(c,x-dx*size+dy*size*.7,y-dy*size-dx*size*.7,x,y,col);}
function hash(i,s=0){let n=Math.imul(i+1949,374761393)^Math.imul(s+1531,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296;}
function reduced(renderer,state){return !!(state?.reducedMotion||renderer.reducedMotion);}

/** Chamado antes dos atores, no espaço do mundo, para preservar a leitura. */
export function drawTelegraph(renderer,c,e,isBoss,time=0){
 if(!e||(!(e.telegraph>0)&&!(e.attackTimer>0&&(e.pattern==='slam'||e.type==='heavy'))))return;
 const pattern=isBoss?e.pattern:e.type==='ranged'?'ranged':'melee';
 const x=e.x,y=e.y,a=e.angle||0,r=e.attackRadius||(isBoss?85:30),attacking=!(e.telegraph>0);
 const total=e.telegraphTime||(e.type==='heavy'?.72:e.type==='ranged'?.6:.38),progress=attacking?1:clamp(1-e.telegraph/total,0,1);
 const pulse=reduced(renderer)?1:.88+Math.sin(time*4)*.12,col=attacking?CREAM:GOLD,edge=attacking?'#b0e3cd':'#a67555';
 c.save();c.globalAlpha=attacking?clamp((e.attackTimer||0)/.42,.25,1):pulse;
 if(pattern==='charge'||pattern==='beam'){
  const length=pattern==='charge'?265*(.8+(e.id%3)*.08)+(e.radius||25):320;
  const spread=pattern==='charge'?(e.radius||25)+9:17+(e.phase||1)*3,dx=Math.cos(a),dy=Math.sin(a);
  // O feixe percorre exatamente 320 unidades; a faixa nunca fica mais larga.
  c.globalAlpha*=.1;poly(c,[[x-dy*spread,y+dx*spread],[x+dx*length-dy*spread,y+dy*length+dx*spread],[x+dx*length+dy*spread,y+dy*length-dx*spread],[x+dy*spread,y-dx*spread]],col);c.globalAlpha=attacking?.75:pulse;
  for(const side of[-1,1]){const sx=x-dy*spread*side,sy=y+dx*spread*side;line(c,sx,sy,sx+dx*length,sy+dy*length,INK);line(c,sx+dy*side,sy-dx*side,sx+dx*length+dy*side,sy+dy*length-dx*side,col);}
  for(let d=26;d<length;d+=28){const px=x+dx*d,py=y+dy*d;arrow(c,px,py,a,d/length<progress?CREAM:edge,5);}
  line(c,x+dx*length-dy*spread,y+dy*length+dx*spread,x+dx*length+dy*spread,y+dy*length-dx*spread,col);
  // Feixe ativo é distinto da preparação, com uma linha central de luz.
  if(attacking&&pattern==='beam')line(c,x,y,x+dx*length,y+dy*length,CREAM,3);
 }else if(pattern==='slam'||pattern==='melee'){
  c.globalAlpha*=.085;oval(c,x,y,r,r,col);c.globalAlpha=attacking?.8:pulse;
  ring(c,x,y,r,r,INK);ring(c,x,y,r-1,r-1,col);
  ring(c,x,y,r-4,r-4,edge,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);
  for(let i=0;i<(isBoss?8:4);i++){const aa=i*Math.PI/(isBoss?4:2),xx=x+Math.cos(aa)*(r-7),yy=y+Math.sin(aa)*(r-7);arrow(c,xx,yy,aa+Math.PI,col,3);}
  if(attacking){const wave=clamp(1-(e.attackTimer||0)/.42,0,1);ring(c,x,y,Math.max(3,r*wave),Math.max(3,r*wave),CREAM);}
 }else if(pattern==='fan'||pattern==='ranged'){
  const count=pattern==='ranged'?1:3+(e.phase||1)*2;
  for(let i=0;i<count;i++){const aa=a+(i-(count-1)/2)*.19,dx=Math.cos(aa),dy=Math.sin(aa);for(let d=(e.radius||9)+9;d<89;d+=11){rect(c,x+dx*d,y+dy*d,1,d/89<progress?2:1,d/89<progress?col:edge);}arrow(c,x+dx*87,y+dy*87,aa,col,4);}
 }else if(pattern==='radial'||pattern==='orbit'){
  const count=(e.projectileCount||6+(e.id||0)%4)+((e.phase||1)-1)*2;
  const origin=pattern==='radial'?((e.id||0)%5)*.18:a,spawn=e.radius||25;
  for(let i=0;i<count;i++){const aa=i/count*Math.PI*2+origin;
   if(pattern==='orbit'){const curve=(e.id%2?-1:1)*.25;let last;for(let j=0;j<5;j++){const angle=aa+j*curve*.22,d=spawn+8+j*7,p=[x+Math.cos(angle)*d,y+Math.sin(angle)*d];if(last)line(c,last[0],last[1],p[0],p[1],j/5<progress?col:edge);last=p;}arrow(c,last[0],last[1],aa+curve,col,3);}
   else{line(c,x+Math.cos(aa)*(spawn+8),y+Math.sin(aa)*(spawn+8),x+Math.cos(aa)*(spawn+27),y+Math.sin(aa)*(spawn+27),edge);arrow(c,x+Math.cos(aa)*(spawn+27),y+Math.sin(aa)*(spawn+27),aa,col,4);}
  }
 }
 c.restore();
}

/** Sete tratamentos legíveis: flecha, flecha carregada, pólen, cristal,
 * gota, pérola de impacto e pétala orbital. Colisão continua no centro real. */
export function drawProjectile(renderer,c,p,time=0){
 if(!p)return;
 const x=Math.round(p.x),y=Math.round(p.y),r=Math.max(2,p.radius||4),a=Math.atan2(p.vy||0,p.vx||1),dx=Math.cos(a),dy=Math.sin(a),col=p.color||GOLD;
 c.save();
 // Rastro curtíssimo e translúcido comunica velocidade sem aparentar dano.
 c.globalAlpha=.25;for(let j=1;j<=3;j++)rect(c,x-dx*j*4,y-dy*j*4,1,1,col);c.globalAlpha=1;
 if(p.owner==='player'){
  line(c,x-dx*7,y-dy*7,x+dx*2,y+dy*2,INK,3);line(c,x-dx*7,y-dy*7,x+dx*2,y+dy*2,CREAM);
  poly(c,[[x+dx*r,y+dy*r],[x-dy*2,y+dx*2],[x-dx*2,y-dy*2],[x+dy*2,y-dx*2]],p.pierce>0?'#b4e8da':'#e0c28d');
  line(c,x-dx*6-dy*2,y-dy*6+dx*2,x-dx*4,y-dy*4,'#a2cbb9');line(c,x-dx*6+dy*2,y-dy*6-dx*2,x-dx*4,y-dy*4,'#a2cbb9');
  if(p.pierce>0){line(c,x-dx*7-dy*2,y-dy*7+dx*2,x-dx*2-dy*2,y-dy*2+dx*2,GOLD);rect(c,x,y,1,1,'#fff9e2');}
 }else if(p.curve){
  const spin=reduced(renderer)?0:Math.floor(time*6)*Math.PI/4;
  for(let i=0;i<3;i++){const aa=spin+i*Math.PI*2/3;poly(c,[[x,y],[x+Math.cos(aa)*r,y+Math.sin(aa)*r],[x+Math.cos(aa+.55)*(r-1),y+Math.sin(aa+.55)*(r-1)]],i===1?CREAM:col);}
  rect(c,x-1,y-1,3,3,'#fff5d8');
 }else if(r>=6){
  oval(c,x,y,r,r,INK);oval(c,x,y,r-1,r-1,col);oval(c,x-1,y-1,r-3,r-3,CREAM);rect(c,x-2,y-3,2,2,'#fff9eb');rect(c,x+2,y+2,2,1,'#bc9e8a');
 }else{
  const hex=/^#[\da-f]{6}$/i.test(col)?parseInt(col.slice(1),16):0xf0c580,red=hex>>>16,green=(hex>>>8)&255,blue=hex&255;
  if(blue>red+8){
   poly(c,[[x+dx*r,y+dy*r],[x-dy*r,y+dx*r],[x-dx*r,y-dy*r],[x+dy*r,y-dx*r]],INK);
   poly(c,[[x+dx*(r-1),y+dy*(r-1)],[x-dy*(r-1),y+dx*(r-1)],[x-dx*(r-1),y-dy*(r-1)],[x+dy*(r-1),y-dx*(r-1)]],col);line(c,x-dx*2,y-dy*2,x+dx*2,y+dy*2,CREAM);
  }else if(green>red+10||blue>red-20){
   poly(c,[[x+dx*r,y+dy*r],[x-dy*r,y+dx*r],[x-dx*(r-1)-dy*2,y-dy*(r-1)+dx*2],[x-dx*(r-1)+dy*2,y-dy*(r-1)-dx*2]],col);line(c,x-dx*2-dy,y-dy*2+dx,x+dx-dy,y+dy+dx,CREAM);
  }else{
   oval(c,x,y,r,r,INK);for(const[xx,yy]of[[-2,-1],[1,-2],[-1,2],[2,1]])rect(c,x+xx,y+yy,2,2,col);rect(c,x-1,y-1,2,2,CREAM);
  }
 }
 c.restore();
}

/** Fenda luminosa monumental e seus três focos; jamais uma imagem infernal. */
export function drawRift(renderer,c,world,state,time=0){
 if(!world.rift)return;
 const{x,y}=world.rift,closed=state.riftClosed,motion=reduced(renderer,state)?0:time;
 c.save();
 oval(c,x,y+2,65,16,'#718e9255');oval(c,x,y,54,12,'#ccd9ba');ring(c,x,y,51,10,'#e9dfbf');ring(c,x,y,37,7,'#a7c9be');
 for(let i=0;i<12;i++){const aa=i*Math.PI/6;rect(c,x+Math.cos(aa)*45,y+Math.sin(aa)*9,2,1,'#fff0cc');}
 if(!closed){
  // Um arco suspenso, com os vazios preservados em vez de uma massa opaca.
  c.globalAlpha=.19;oval(c,x,y-64,32,55,'#a6e8d6');c.globalAlpha=.1;oval(c,x,y-64,41,63,'#fbefd1');c.globalAlpha=1;
  const steps=32;for(let i=0;i<steps;i++){const aa=-Math.PI+i/(steps-1)*Math.PI,px=x+Math.cos(aa)*39,py=y-64+Math.sin(aa)*58;rect(c,px-3,py-2,6,5,'#617e8a');rect(c,px-2,py-3,4,4,i%4===0?'#ebc586':'#e8e5ce');rect(c,px-2,py-3,3,1,CREAM);}
  for(const side of[-1,1]){rect(c,x+side*38-3,y-66,6,51,'#a5c9bc');rect(c,x+side*38-2,y-66,3,50,'#e3e5c8');rect(c,x+side*38-5,y-18,10,4,GOLD);rect(c,x+side*38-4,y-14,8,3,'#fcf0d0');}
  // O centro tem forma de estrela/flor, numa faixa de cores aquáticas.
  const wave=Math.round(Math.sin(motion*.7)*2);
  poly(c,[[x,y-113],[x+10+wave,y-76],[x+23,y-62],[x+9,y-46],[x,y-18],[x-8,y-48],[x-22,y-62],[x-9-wave,y-78]],'#a9dccc');
  poly(c,[[x,y-105],[x+5,y-75],[x+16,y-62],[x+4,y-51],[x,y-27],[x-4,y-52],[x-15,y-62],[x-5,y-76]],'#f1edcd');
  line(c,x,y-99,x,y-33,'#fff7dd',2);star(c,x,y-63,10,'#fff9e8');
  ring(c,x,y-64,28,49,'#aedfda',0,Math.PI*2,7);ring(c,x,y-64,24,45,'#f0dba0',0,Math.PI*2,11);
  for(let i=0;i<6;i++){const aa=i*Math.PI/3+motion*.15;star(c,x+Math.cos(aa)*27,y-64+Math.sin(aa)*44,i%2?1:2,CREAM);}
 }else{
  // Após o fechamento, a mesma arquitetura condensa numa estrela serena.
  ring(c,x,y-46,21,21,'#cee7d1',0,Math.PI*2,6);star(c,x,y-46,12,CREAM);star(c,x,y-46,6,'#fffaf0');
 }
 for(let i=0;i<(world.riftNodes||[]).length;i++){
  const node=world.riftNodes[i],active=state.riftNodes?.includes(node.id??i),nx=node.x,ny=node.y;
  oval(c,nx,ny+2,17,5,'#809e9c66');oval(c,nx,ny,14,4,'#a2bca9');rect(c,nx-10,ny-6,20,5,'#d9d8ba');rect(c,nx-8,ny-9,16,3,'#f2e8c7');
  poly(c,[[nx-5,ny-10],[nx-6,ny-30],[nx+6,ny-30],[nx+5,ny-10]],'#9cbab1');rect(c,nx-5,ny-28,3,17,'#e4e1c5');rect(c,nx-8,ny-31,16,3,GOLD);rect(c,nx-7,ny-30,14,1,CREAM);
  poly(c,[[nx,ny-48],[nx+9,ny-38],[nx+6,ny-30],[nx-6,ny-30],[nx-9,ny-38]],active?'#80cdbb':'#bfa278');poly(c,[[nx,ny-47],[nx,ny-32],[nx-6,ny-32],[nx-8,ny-38]],active?'#d7f1d8':'#f1dca8');
  if(active){star(c,nx,ny-37,3,'#fff8df');const endX=x,endY=y-63;for(let j=0;j<26;j++){const f=j/26,px=nx+(endX-nx)*f,py=ny-37+(endY-ny+37)*f+Math.round(Math.sin(j*.8+motion*3)*2);rect(c,px,py,2,1,j%3?'#c6ead7':'#fff1cc');}}
  else{rect(c,nx-2,ny-16,5,2,'#b69265');rect(c,nx,ny-20,1,5,'#b69265');}
 }
 c.restore();
}

/** Camada leve de profundidade, coordenadas de tela, sem encobrir combates. */
export function drawAmbience(renderer,c,world,state,time=0,darkness=0){
 const w=c.canvas.width,h=c.canvas.height,cam=renderer.camera||{x:0,y:0},quiet=reduced(renderer,state),t=quiet?0:time,combat=!!state.boss||(state.enemies?.length||0)>1;
 c.save();
 // Cada bioma tem um tipo de partícula próprio e poucos pixels em movimento.
 const counts=combat?9:17,biome=world.biome;
 for(let i=0;i<counts;i++){
  const seed=hash(i,biome),speed=biome===2?7:biome===7?5:2.5;
  const x=((seed*w*1.3+t*speed-cam.x*.1)%(w+40)+(w+40))%(w+40)-20;
  const y=((hash(i+43,biome)*h+t*.45+Math.sin(t*.5+i)*7-cam.y*.07)%(h+30)+(h+30))%(h+30)-15;
  c.globalAlpha=darkness>.2?.48:combat?.2:.32;
  if(darkness>.2){rect(c,x,y,1,1,CREAM);if(!quiet&&Math.sin(t*.7+i)>.65){c.globalAlpha=.09;rect(c,x-1,y-1,3,3,GOLD);}}
  else if(biome===6){poly(c,[[x,y-2],[x+2,y],[x,y+2],[x-1,y]],i%2?'#ead1f2':'#c7eee0');}
  else if(biome===3){rect(c,x,y,2,1,'#e2f5e6');rect(c,x+1,y-1,1,1,'#fff0cb');}
  else if(biome===2){line(c,x,y,x+3,y-1,'#f7e4a8');}
  else if(biome===1){poly(c,[[x,y],[x+3,y-2],[x+2,y+1]],'#c5dca9');}
  else{rect(c,x,y,2,i%3?1:2,biome===5?'#dfefdf':biome>=8?'#f4e7ba':'#f4d0bd');}
 }
 // Nuvens em camadas apenas em céu alto e brumas; transparência baixa.
 if([4,5,7,9].includes(biome)&&!combat){
  c.globalAlpha=biome===5?.045:.035;
  for(let i=0;i<3;i++){const x=((i*237+t*2.5-cam.x*.09)%(w+280)+(w+280))%(w+280)-140,y=h*(.19+i*.29)-cam.y*.025;oval(c,x,y,75,8,'#fff4dc');oval(c,x+48,y+3,52,7,'#f5fff1');}
 }
 // Borboletas distantes passam ocasionalmente pelos jardins, fora de combate.
 if(!quiet&&!combat&&[0,1,3,6].includes(biome)&&Math.floor(t/17)%3===1){
  const cycle=t%17,x=w*(.22+cycle*.025)-cam.x*.025,y=h*.39+Math.sin(t*.6)*10,wing=Math.floor(t*5)%2;
  c.globalAlpha=.52;rect(c,x,y,1,3,INK);rect(c,x-wing-2,y-1,2,wing+2,biome===6?'#d6c5ea':'#eed8a9');rect(c,x+1,y-1,wing+2,2,'#eff0ca');
 }
 c.restore();
}
