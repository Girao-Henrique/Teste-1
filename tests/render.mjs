import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';

const {chromium}=createRequire(import.meta.url)('playwright');
const artifactRoot=resolve('tests/artifacts/render');
await mkdir(artifactRoot,{recursive:true});
const url=process.env.PARADISE_TEST_URL||'http://127.0.0.1:5173';
const browser=await chromium.launch({headless:true,...(existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const failures=[],errors=[];
let result;
try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(url);
  await page.evaluate(()=>document.fonts.ready);
  result=await page.evaluate(async()=>{
    const {Renderer}=await import('/src/render/renderer.js');
    const {GameEngine}=await import('/src/game/engine.js');
    const {buildWorld}=await import('/src/world/world.js');
    const {BIOMES,BOSSES}=await import('/src/data/content.js');
    const images={},checks=[],pixelStats={};
    const target=document.createElement('canvas'),renderer=new Renderer(target);
    const stats=(canvas,rect={x:0,y:0,width:canvas.width,height:canvas.height})=>{
      const rgba=canvas.getContext('2d').getImageData(rect.x,rect.y,rect.width,rect.height).data;
      let transparent=0,opaque=0,partial=0,hash=2166136261;const colors=new Set();
      for(let i=0;i<rgba.length;i+=4){
        const alpha=rgba[i+3];if(alpha===0)transparent++;else if(alpha===255)opaque++;else partial++;
        if(alpha)colors.add(`${rgba[i]},${rgba[i+1]},${rgba[i+2]},${alpha}`);
        for(let j=0;j<4;j++)hash=Math.imul(hash^rgba[i+j],16777619)>>>0;
      }
      return{width:rect.width,height:rect.height,transparent,opaque,partial,colors:colors.size,hash};
    };
    const record=(name,canvas,{full=false}={})=>{
      images[name]=canvas.toDataURL('image/png');pixelStats[name]=stats(canvas);
      checks.push({name:`${name}: contém pixels visíveis`,ok:pixelStats[name].opaque+pixelStats[name].partial>0});
      if(full)checks.push({name:`${name}: cena opaca completa`,ok:pixelStats[name].transparent===0&&pixelStats[name].partial===0});
    };
    const game=new GameEngine();game.start('normal');game.drainEvents();
    const base=structuredClone(game.state);base.tutorial={opening:true,guide:true};
    // Apenas apresentação: nenhum fixture avança ou vence a campanha.
    for(const biome of BIOMES){
      const world=buildWorld(biome.id),state=structuredClone(base);
      state.biome=biome.id;state.supports=[biome.id];state.worldTime=780*.12;
      Object.assign(state.player,world.spawn,{weapon:'sword',moving:true});
      renderer.resize(1280,720);renderer.draw(state,world,2.45);
      record(`biomas/${String(biome.id+1).padStart(2,'0')}-entrada.png`,target,{full:true});
      const landmark=world.landmark||world.objects.find(o=>o.type==='landmark');
      if(landmark){Object.assign(state.player,{x:landmark.x,y:landmark.y+120});renderer.draw(state,world,3.25);record(`biomas/${String(biome.id+1).padStart(2,'0')}-marco.png`,target,{full:true});}
      Object.assign(state.player,{x:world.bosses[1].x,y:world.bosses[1].y+125});
      state.worldTime=780*.72;renderer.draw(state,world,6.5);
      record(`biomas/${String(biome.id+1).padStart(2,'0')}-noite.png`,target,{full:true});
    }
    // Duas poses dos 20 chefes no mundo e células isoladas para verificar silhuetas.
    const bossAtlas=document.createElement('canvas');bossAtlas.width=192*5;bossAtlas.height=160*4;
    const ac=bossAtlas.getContext('2d');ac.imageSmoothingEnabled=false;
    const isolated=[];
    for(const data of BOSSES){
      const world=buildWorld(data.biome),marker=world.bosses.find(b=>b.id===data.id),state=structuredClone(base);
      Object.assign(state.player,{x:marker.x,y:marker.y+110,weapon:'sword',facing:{x:0,y:-1},attackTimer:.24,strongAttack:true});
      state.biome=data.biome;state.worldTime=780*.12;state.supports=[data.biome];
      state.boss={...data,x:marker.x,y:marker.y,hp:data.hp,maxHp:data.hp,radius:30,angle:Math.PI/2,phase:2,telegraph:.48,attackRadius:90,attackTimer:.18,chargeTimer:.24,entityId:`boss-${data.id}`,isBoss:true};
      state.projectiles=[{x:marker.x-50,y:marker.y+45,vx:110,vy:60,owner:'enemy',color:data.accent,kind:'orb'},{x:marker.x+42,y:marker.y+60,vx:0,vy:-120,owner:'player',kind:'arrow'}];
      state.particles=[{x:marker.x+20,y:marker.y-10,life:.6,size:3,color:data.accent},{x:marker.x-18,y:marker.y+10,life:.5,text:'12',color:'#fff0cd'}];
      renderer.resize(1280,720);renderer.draw(state,world,2.7);
      record(`chefes/${String(data.id+1).padStart(2,'0')}-ataque.png`,target,{full:true});
      const cell=document.createElement('canvas');cell.width=192;cell.height=160;
      const ctx=cell.getContext('2d');ctx.imageSmoothingEnabled=false;
      renderer.prepare(world);
      renderer.boss(ctx,{...state.boss,x:96,y:128,telegraph:0,attackTimer:0,chargeTimer:0},.1,state);
      const idle=stats(cell);ctx.clearRect(0,0,192,160);
      renderer.boss(ctx,{...state.boss,x:96,y:128},.6,state);
      const attack=stats(cell);record(`chefes/${String(data.id+1).padStart(2,'0')}-sprite.png`,cell);
      ac.drawImage(cell,data.id%5*192,Math.floor(data.id/5)*160);
      isolated.push({id:data.id,name:data.name,idle,attack});
      checks.push({name:`Chefe ${data.id+1}: sprite próprio visível`,ok:attack.opaque+attack.partial>80});
      checks.push({name:`Chefe ${data.id+1}: pose/animação muda pixels`,ok:idle.hash!==attack.hash});
    }
    checks.push({name:'Vinte chefes: sprites visualmente distintos',ok:new Set(isolated.map(b=>b.attack.hash)).size===20});
    record('chefes/galeria-vinte-chefes.png',bossAtlas);
    const world=buildWorld(0),state=structuredClone(base);Object.assign(state.player,world.spawn,{weapon:'sword'});
    const sizes=[{width:320,height:568},{width:390,height:844},{width:640,height:320},{width:720,height:720},{width:2560,height:1080}];
    const dimensions=[];
    for(const size of sizes){
      renderer.resize(size.width,size.height);renderer.draw(state,world,2.4);
      const logical={width:target.width,height:target.height},ratioDelta=Math.abs(logical.width/logical.height-size.width/size.height);
      dimensions.push({css:size,logical,ratioDelta});
      checks.push({name:`Canvas ${size.width}×${size.height}: proporção preservada`,ok:ratioDelta<.01});
      checks.push({name:`Canvas ${size.width}×${size.height}: eixo curto 360`,ok:Math.min(target.width,target.height)===360});
      checks.push({name:`Canvas ${size.width}×${size.height}: nearest neighbor`,ok:renderer.ctx.imageSmoothingEnabled===false});
      record(`formatos/${size.width}x${size.height}.png`,target,{full:true});
      const point=renderer.screenToWorld(20,40);
      checks.push({name:`Canvas ${size.width}×${size.height}: mira acompanha câmera`,ok:point.x===renderer.camera.x+20&&point.y===renderer.camera.y+40});
    }
    const sheets=renderer.exportSheets();
    checks.push({name:'Folhas exportadas: pacote completo',ok:Object.keys(sheets).length>=16});
    for(const [path,dataURL] of Object.entries(sheets)){
      const img=new Image();img.src=dataURL;await img.decode();
      const sheet=document.createElement('canvas');sheet.width=img.width;sheet.height=img.height;sheet.getContext('2d').drawImage(img,0,0);
      const name=`atlas/${path.replace(/^assets\//,'')}`;
      record(name,sheet);
      checks.push({name:`${path}: PNG válido`,ok:dataURL.startsWith('data:image/png;base64,')&&img.width>0&&img.height>0});
      if(path.includes('jogador-movimento')){
        const frameWidth=sheet.width/4,frameHeight=sheet.height/4;
        for(let row=0;row<4;row++){
          const frames=Array.from({length:4},(_,frame)=>stats(sheet,{x:frame*frameWidth,y:row*frameHeight,width:frameWidth,height:frameHeight}));
          checks.push({name:`Jogador, direção ${row+1}: quadros visíveis`,ok:frames.every(f=>f.opaque+f.partial>20)});
          checks.push({name:`Jogador, direção ${row+1}: movimento animado`,ok:new Set(frames.map(f=>f.hash)).size>=2});
        }
      }
      if(path.includes('animations/porteiro-e-guia')||path.includes('animations/retratos')){
        const rows=path.includes('retratos')?3:2,frameWidth=sheet.width/4,frameHeight=sheet.height/rows;
        for(let row=0;row<rows;row++){
          const frames=Array.from({length:4},(_,frame)=>stats(sheet,{x:frame*frameWidth,y:row*frameHeight,width:frameWidth,height:frameHeight}));
          checks.push({name:`${path}, personagem ${row+1}: quadros visíveis`,ok:frames.every(f=>f.opaque+f.partial>20)});
          checks.push({name:`${path}, personagem ${row+1}: animação muda pixels`,ok:new Set(frames.map(f=>f.hash)).size>=2});
        }
      }
      if(path.includes('luz-e-fenda')){
        const frameWidth=sheet.width/5,frameHeight=sheet.height/2;
        for(let frame=0;frame<5;frame++){
          const margin=document.createElement('canvas');margin.width=frameWidth+128;margin.height=frameHeight+128;
          renderer.rift(margin.getContext('2d'),{rift:{x:frameWidth/2+64,y:frameHeight-20+64},riftNodes:[]},{riftNodes:[],riftClosed:false},frame*.3);
          const full=stats(margin),bounded=stats(margin,{x:64,y:64,width:frameWidth,height:frameHeight});
          checks.push({name:`Fenda, quadro ${frame+1}: efeito cabe na célula`,ok:full.opaque+full.partial===bounded.opaque+bounded.partial});
        }
      }
      if(path.includes('vinte-chefes')){
        const frameWidth=sheet.width/5,frameHeight=sheet.height/4;
        for(let id=0;id<20;id++){
          const cell=stats(sheet,{x:id%5*frameWidth,y:Math.floor(id/5)*frameHeight,width:frameWidth,height:frameHeight});
          checks.push({name:`Atlas, chefe ${id+1}: célula visível`,ok:cell.opaque+cell.partial>80});
          const margin=document.createElement('canvas');margin.width=frameWidth+128;margin.height=frameHeight+128;
          const context=margin.getContext('2d');
          renderer.boss(context,{...BOSSES[id],x:frameWidth/2+64,y:frameHeight-24+64,hp:BOSSES[id].hp,maxHp:BOSSES[id].hp,radius:30},0,{});
          const full=stats(margin),bounded=stats(margin,{x:64,y:64,width:frameWidth,height:frameHeight});
          checks.push({name:`Atlas, chefe ${id+1}: sprite cabe na célula`,ok:full.opaque+full.partial===bounded.opaque+bounded.partial});
        }
      }
    }
    return{images,checks,pixelStats,dimensions,isolated,sheets:Object.keys(sheets)};
  });
  for(const [name,data] of Object.entries(result.images)){
    if(name.includes('..')||name.startsWith('/'))throw Error('Destino de arte fora do diretório de teste.');
    const destination=resolve(artifactRoot,name);await mkdir(dirname(destination),{recursive:true});
    await writeFile(destination,Buffer.from(data.split(',')[1],'base64'));
  }
  for(const check of result.checks)if(!check.ok)failures.push(check.name);
  if(errors.length)failures.push(...errors.map(message=>`JavaScript: ${message}`));
  const {images,...diagnosis}=result;
  await writeFile(resolve(artifactRoot,'diagnostico.json'),JSON.stringify({...diagnosis,errors,failures},null,2));
  console.log(`Render: ${result.checks.length} verificações, ${Object.keys(images).length} imagens, ${result.sheets.length} folhas exportadas.`);
  if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}else console.log('Dez biomas, 20 chefes, quadros do jogador, efeitos, transparência, câmera e proporções passaram.');
}catch(error){
  failures.push(error.message);
  await writeFile(resolve(artifactRoot,'diagnostico.json'),JSON.stringify({errors,failures,stack:error.stack},null,2));
  console.error(`Render interrompido: ${error.message}`);process.exitCode=1;
}finally{await browser.close();}
