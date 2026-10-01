/** Retratos originais de Paradise? — desenho autoral na grade de 96 × 96.
 * O volume vem de planos de cor e contornos em pixels; não há filtros sobre
 * fotografias, ilustrações prontas ou fontes externas. Animação econômica:
 * respiração, cabelo/fitas ao vento e piscadas, sem distrair do diálogo.
 */
const INK='#29394b',GOLD='#edc27c',CREAM='#fff0cf';
function rect(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function poly(c,points,col){c.fillStyle=col;for(let y=Math.ceil(Math.min(...points.map(p=>p[1])));y<=Math.max(...points.map(p=>p[1]));y++){const xs=[];for(let i=0;i<points.length;i++){const[x1,y1]=points[i],[x2,y2]=points[(i+1)%points.length];if((y1<=y&&y2>y)||(y2<=y&&y1>y))xs.push(x1+(y-y1)/(y2-y1)*(x2-x1));}xs.sort((a,b)=>a-b);for(let i=0;i<xs.length;i+=2)c.fillRect(Math.ceil(xs[i]),y,Math.floor(xs[i+1])-Math.ceil(xs[i])+1,1);}}
function oval(c,x,y,rx,ry,col){c.fillStyle=col;for(let yy=-ry;yy<=ry;yy++){const span=Math.floor(rx*Math.sqrt(Math.max(0,1-yy*yy/(ry*ry))));c.fillRect(Math.round(x)-span,Math.round(y)+yy,span*2+1,1);}}
function line(c,x1,y1,x2,y2,col,w=1){x1=Math.round(x1);y1=Math.round(y1);x2=Math.round(x2);y2=Math.round(y2);const dx=Math.abs(x2-x1),sx=x1<x2?1:-1,dy=-Math.abs(y2-y1),sy=y1<y2?1:-1;let err=dx+dy;for(let i=0;i<300;i++){rect(c,x1-Math.floor(w/2),y1-Math.floor(w/2),w,w,col);if(x1===x2&&y1===y2)break;const e=2*err;if(e>=dy){err+=dy;x1+=sx;}if(e<=dx){err+=dx;y1+=sy;}}}
function star(c,x,y,r,col){line(c,x-r,y,x+r,y,col);line(c,x,y-r,x,y+r,col);rect(c,x-1,y-1,3,3,col);}
function sprig(c,x,y,side){line(c,x,y,x+side*12,y-20,'#4c8b82');for(let i=0;i<4;i++){const yy=y-i*5,xx=x+side*i*3;poly(c,[[xx,yy],[xx-side*5,yy-4],[xx-side*6,yy-7],[xx-side,yy-5]],i%2?'#83b49e':'#b1d0b2');poly(c,[[xx,yy-1],[xx+side*7,yy-4],[xx+side*8,yy-7],[xx+side*3,yy-4]],'#6ca992');}}
function backdrop(c,kind,time){
 rect(c,0,0,96,96,INK);rect(c,2,2,92,92,'#b08b65');rect(c,3,3,90,90,'#234e58');
 const colors=kind==='gate'?['#a4d9bb','#94ccac','#84b99e','#71a78f','#578d7f']:kind==='guide'?['#c7dacf','#b2cdbf','#94bcb3','#729c9c','#557e8f']:['#c0ddc5','#a4cbbc','#83b8ab','#679c96','#477f83'];
 colors.forEach((col,i)=>rect(c,4,4+i*18,88,18,col));
 poly(c,[[4,63],[23,31],[41,62],[64,36],[91,70],[91,91],[4,91]],'#62968b');
 poly(c,[[4,80],[22,62],[39,79],[61,65],[92,85],[92,92],[4,92]],'#497e7b');
 for(let i=0;i<16;i++){const x=7+(i*37)%80,y=8+(i*23)%53;rect(c,x,y,1,i%3?1:2,'#d8e8c3');}
 sprig(c,10,86,1);sprig(c,86,86,-1);
 // Borda permanece fixa: detalhes botânicos ligam os três personagens.
 for(const[x,y,sx,sy]of[[4,4,1,1],[91,4,-1,1],[4,91,1,-1],[91,91,-1,-1]]){line(c,x,y,x+sx*10,y,GOLD);line(c,x,y,x,y+sy*10,GOLD);rect(c,x+sx*3,y+sy*3,2,2,CREAM);}
 if(time>0){const y=16+Math.round(Math.sin(time*.7)*2);star(c,80,y,2,'#e9e7bb');}
}
function face(c,kind,breathe,blink){
 const gate=kind==='gate',guide=kind==='guide';
 const skin=gate?'#e3be99':guide?'#e8c8a1':'#d5a277',skinShade=gate?'#bc8d70':guide?'#bc957d':'#ae795f',skinLight=gate?'#f8d8ab':guide?'#f4dfb8':'#edbd8e';
 const x=47,y=48+breathe;
 oval(c,x,y,gate?17:guide?13:14,gate?17:18,INK);
 oval(c,x-1,y-1,gate?15:guide?12:13,16,skinShade);
 poly(c,[[x-10,y-14],[x+5,y-14],[x+10,y-7],[x+9,y+9],[x+3,y+16],[x-8,y+12],[x-12,y+3]],skin);
 poly(c,[[x-10,y-10],[x-6,y-13],[x+1,y-13],[x+4,y-7],[x+1,y-1],[x-8,y]],skinLight);
 oval(c,x-(gate?16:13),y+1,3,5,skin);rect(c,x-(gate?16:13)-1,y+1,2,3,skinShade);
 oval(c,x+(gate?16:13),y+1,2,4,skinShade);
 // Planos da testa, nariz, bochechas e queixo, sem excesso de contornos.
 rect(c,x+1,y,2,7,skinShade);rect(c,x,y+4,4,2,skinLight);rect(c,x-6,y+13,9,2,skinLight);
 const eyes=guide?'#536a72':'#405454';
 if(blink){line(c,x-8,y-2,x-3,y-1,eyes);line(c,x+5,y-1,x+9,y-2,eyes);}
 else{rect(c,x-9,y-3,6,3,CREAM);rect(c,x+4,y-3,6,3,CREAM);rect(c,x-6,y-3,2,3,eyes);rect(c,x+6,y-3,2,3,eyes);rect(c,x-6,y-3,1,1,'#faf4d7');rect(c,x+6,y-3,1,1,'#faf4d7');}
 const brow=gate?'#7b847b':guide?'#9d9e91':'#6b514b';line(c,x-9,y-6,x-4,y-7,brow);line(c,x+4,y-7,x+10,y-6,brow);
 if(gate){line(c,x-11,y+2,x-8,y+3,skinShade);line(c,x+8,y+3,x+11,y+2,skinShade);line(c,x-8,y+7,x-7,y+10,skinShade);line(c,x+7,y+7,x+6,y+10,skinShade);line(c,x-5,y+10,x+5,y+10,'#886c5f');rect(c,x-3,y+11,6,1,CREAM);}
 else if(guide){line(c,x-3,y+9,x+3,y+9,'#9c7164');rect(c,x,y+10,3,1,skinLight);}
 else{line(c,x-4,y+10,x+3,y+9,'#805f51');for(const[dx,dy]of[[-8,10],[-7,13],[-3,15],[2,15],[6,12],[7,9]])rect(c,x+dx,y+dy,1,1,'#a1735c');}
}
function traveler(c,time){
 const breath=Math.round(Math.sin(time*2)*.7),wind=Math.round(Math.sin(time*2.3)*1);
 poly(c,[[27,66+breath],[38,59+breath],[56,59+breath],[71,72+breath],[79,92],[16,92]],INK);
 poly(c,[[29,67+breath],[38,62+breath],[57,62+breath],[69,73+breath],[76,91],[20,91]],'#347b83');
 poly(c,[[35,63+breath],[39,65+breath],[39,91],[22,91],[29,72]],'#69a9a0');
 poly(c,[[56,63+breath],[66,70+breath],[76,92],[58,92]],'#285c70');
 poly(c,[[39,63+breath],[53,62+breath],[60,72+breath],[55,92],[36,92]],'#dbc5a2');
 rect(c,39,76+breath,16,2,'#f5e1b7');rect(c,43,79+breath,2,13,'#ad947d');
 line(c,29,70+breath,62,91,'#936b54',5);line(c,29,69+breath,62,90,'#bf946b',2);
 oval(c,57,85,4,4,INK);oval(c,57,84,3,3,GOLD);star(c,57,84,2,CREAM);
 rect(c,41,57+breath,13,11,'#b57e61');rect(c,43,60+breath,8,7,'#ddb084');
 face(c,'traveler',breath,time>0&&time%5.9>5.65);
 // Cabelo ondulado, mecha reconhecível e nuca sem desaparecer no capuz.
 poly(c,[[31,43+breath],[29,36+breath],[33,31+breath],[32,27+breath],[38,25+breath],[42,22+breath],[49,24+breath],[54,22+breath],[61,27+breath],[65,33+breath],[62,46+breath],[58,40+breath],[58,35+breath],[53,34+breath],[48,30+breath],[42,35+breath],[35,35+breath],[35,43+breath]],'#584944');
 poly(c,[[33,33+breath],[36,29+breath],[41,27+breath],[45,29+breath],[49,26+breath],[53,28+breath],[59,29+breath],[59,33+breath],[53,32+breath],[49,29+breath],[43,32+breath],[37,33+breath]],'#937058');
 rect(c,38,28+breath,4,1,'#bf9670');rect(c,54,30+breath,3,1,'#bf9670');
 poly(c,[[34,62+breath],[41,67+breath],[34,77+wind],[22,75+wind]],'#88bbaa');line(c,24,75+wind,34,76+wind,GOLD);
}
function gatekeeper(c,time){
 const breath=Math.round(Math.sin(time*1.7)*.6),blink=time>0&&time%6.6>6.35;
 poly(c,[[26,66+breath],[37,59+breath],[60,59+breath],[75,74+breath],[83,92],[15,92]],INK);
 poly(c,[[27,68+breath],[38,62+breath],[58,62+breath],[72,73+breath],[79,92],[19,92]],'#dedfbd');
 poly(c,[[28,69+breath],[36,64+breath],[38,90],[22,92]],'#fff0cd');
 poly(c,[[59,65+breath],[71,74+breath],[78,92],[59,92]],'#b3c9b4');
 rect(c,39,63+breath,18,12,'#c99c7d');rect(c,42,63+breath,12,9,'#eac7a0');
 poly(c,[[38,66+breath],[48,73+breath],[57,66+breath],[65,75+breath],[56,82+breath],[48,77+breath],[40,82+breath],[30,75+breath]],'#44857a');
 line(c,32,75+breath,40,79+breath,GOLD);line(c,56,79+breath,63,75+breath,GOLD);
 line(c,26,79+breath,22,90,'#f8e8c3',2);line(c,70,79+breath,75,90,'#829e95',2);
 rect(c,45,81,5,10,'#b28b61');rect(c,46,81,3,3,GOLD);rect(c,46,88,3,3,GOLD);
 // A chave e a flor reforçam a profissão do Porteiro, sem símbolo sinistro.
 oval(c,69,80,3,3,GOLD);oval(c,69,80,1,1,'#326c67');line(c,69,83,69,91,GOLD,2);rect(c,69,88,4,2,GOLD);
 face(c,'gate',breath,blink);
 // Barba curta e fios claros ligam a expressão acolhedora ao sprite no mundo.
 poly(c,[[34,53+breath],[39,57+breath],[44,59+breath],[51,59+breath],[58,55+breath],[60,52+breath],[58,61+breath],[54,66+breath],[45,69+breath],[38,65+breath],[35,60+breath]],'#b8c5ad');
 poly(c,[[35,54+breath],[40,59+breath],[44,60+breath],[52,60+breath],[57,57+breath],[56,62+breath],[52,65+breath],[44,67+breath],[39,63+breath]],'#edeccf');
 line(c,42,58+breath,52,58+breath,'#856d5c');rect(c,44,59+breath,6,1,CREAM);
 rect(c,40,61+breath,2,2,'#fff4d7');rect(c,47,63+breath,2,3,'#fff4d7');rect(c,54,61+breath,1,2,'#fff4d7');
 oval(c,31,41+breath,5,11,'#bdc8b7');oval(c,63,41+breath,5,12,'#94ac9f');
 for(const[x,y]of[[29,32],[31,39],[29,46],[65,34],[64,41],[63,48]])rect(c,x,y+breath,3,2,'#f2edd1');
 poly(c,[[29,38+breath],[28,31+breath],[31,25+breath],[36,23+breath],[41,20+breath],[47,22+breath],[54,20+breath],[60,23+breath],[64,30+breath],[65,40+breath],[60,41+breath],[60,34+breath],[54,31+breath],[49,33+breath],[44,30+breath],[38,34+breath],[34,34+breath],[34,43+breath]],'#a4b7aa');
 poly(c,[[29,34+breath],[32,28+breath],[37,25+breath],[42,23+breath],[47,25+breath],[52,23+breath],[58,25+breath],[61,30+breath],[57,32+breath],[53,29+breath],[48,31+breath],[43,27+breath],[38,31+breath],[34,31+breath],[32,36+breath]],'#f0edd0');
 rect(c,36,25+breath,4,2,'#fff6d9');rect(c,49,24+breath,4,1,'#fff6d9');rect(c,57,27+breath,3,1,'#fff6d9');rect(c,61,34+breath,2,5,'#d5ddbf');
 // Bastão floral do Porteiro, oposto ao livro cartográfico do Guia.
 line(c,14,39,12,93,'#786554',4);line(c,13,39,11,93,'#dcbd7b');
 for(const[dx,dy]of[[0,-4],[-4,-1],[4,-1],[-3,3],[3,3]])oval(c,15+dx,34+dy,3,3,CREAM);
 oval(c,15,34,3,3,GOLD);rect(c,14,33,2,2,'#fff8df');
 poly(c,[[13,43],[7,39],[7,34],[12,38]],'#8fc5a4');poly(c,[[15,43],[22,39],[22,35],[17,38]],'#8fc5a4');
 oval(c,17,79+breath,4,4,'#d3a887');rect(c,15,77+breath,3,2,'#f1d0a4');
}
function guide(c,time){
 const breath=Math.round(Math.sin(time*1.5)*.65),wind=Math.round(Math.sin(time*1.8)),blink=time>0&&time%7.3>7.05;
 // Cabelo comprido desenhado atrás dos ombros, com uma mecha azulacinzentada.
 poly(c,[[33,28+breath],[41,22+breath],[54,23+breath],[63,30+breath],[65,67+wind],[59,78],[33,75],[29,54+breath]],INK);
 poly(c,[[34,29+breath],[40,24+breath],[53,25+breath],[60,31+breath],[61,70+wind],[35,70]],'#b6c8c0');
 line(c,34,36+breath,32,64+wind,'#e0e2c6',3);line(c,61,40+breath,63,64+wind,'#819aa1',2);
 poly(c,[[26,70+breath],[40,63+breath],[55,63+breath],[66,71+breath],[74,92],[18,92]],INK);
 poly(c,[[28,71+breath],[39,66+breath],[55,66+breath],[64,72+breath],[71,92],[22,92]],'#3f7e7e');
 poly(c,[[27,74+breath],[39,68+breath],[39,92],[21,92]],'#88bca7');
 poly(c,[[53,68+breath],[63,74+breath],[70,92],[54,92]],'#326375');
 poly(c,[[34,66+breath],[41,70+breath],[42,92],[34,92]],'#fff0cb');
 poly(c,[[56,65+breath],[62,69+breath],[59,92],[52,92]],'#d8d4b7');
 line(c,34,71+breath,36,91,GOLD,2);line(c,61,71+breath,58,91,GOLD,2);
 rect(c,42,57+breath,12,13,'#b8997c');rect(c,44,60+breath,7,10,'#e9cb9f');
 face(c,'guide',breath,blink);
 poly(c,[[33,38+breath],[34,29+breath],[39,26+breath],[48,24+breath],[56,27+breath],[60,34+breath],[60,44+breath],[57,40+breath],[57,33+breath],[50,31+breath],[44,35+breath],[36,36+breath]],'#cbd3bd');
 poly(c,[[35,32+breath],[41,28+breath],[48,26+breath],[52,28+breath],[44,30+breath],[39,34+breath]],'#fff0d1');
 rect(c,36,36+breath,2,20,'#e5e1c1');rect(c,58,37+breath,2,21,'#829da1');
 line(c,41,66+breath,46,78,GOLD);line(c,54,66+breath,48,78,GOLD);
 oval(c,47,80+breath,5,5,INK);oval(c,47,79+breath,4,4,GOLD);star(c,47,79+breath,2,CREAM);
 // Livro cartográfico aberto: páginas de linho e rios em vez de glifos prontos.
 poly(c,[[64,69+breath],[76,67+breath],[86,72+breath],[86,91],[76,88],[64,91]],INK);
 poly(c,[[65,71+breath],[75,69+breath],[75,87],[65,89]],'#fff0cc');
 poly(c,[[77,69+breath],[85,73+breath],[85,89],[77,86]],'#d7d6b8');
 line(c,76,69+breath,76,88,GOLD);line(c,68,76+breath,71,75+breath,'#6b9b93');line(c,71,75+breath,73,79+breath,'#6b9b93');line(c,79,76+breath,82,78+breath,'#6b9b93');line(c,82,78+breath,80,82+breath,'#6b9b93');
 rect(c,68,83+breath,4,1,'#b9b796');rect(c,81,73+breath,1,1,GOLD);rect(c,77,86,2,8,GOLD);
 oval(c,66,85+breath,4,4,'#c99f7e');rect(c,65,83+breath,3,2,'#f0d6ac');
}

/** O canvas mantém resolução própria; o layout pode escalá-lo com pixelated. */
export function drawPortrait(canvas,speaker,time=0){
 if(!canvas)return;
 if(canvas.width!==96||canvas.height!==96){canvas.width=96;canvas.height=96;}
 const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
 const kind=speaker==='Porteiro'||speaker==='gatekeeper'?'gate':speaker==='Guia'||speaker==='guide'?'guide':'traveler';
 backdrop(c,kind,time);
 if(kind==='gate')gatekeeper(c,time);else if(kind==='guide')guide(c,time);else traveler(c,time);
 // Acabamento recortado, alinhado à moldura personalizada da interface.
 rect(c,0,0,5,2,INK);rect(c,91,0,5,2,INK);rect(c,0,94,5,2,INK);rect(c,91,94,5,2,INK);
 return canvas;
}
