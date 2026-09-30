import {spawnSync} from 'node:child_process';
import {readdir,mkdir,readFile,writeFile,rm,copyFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {randomBytes} from 'node:crypto';
const root=resolve(import.meta.dirname,'..'),sdk=process.env.ANDROID_SDK_ROOT||join(root,'.cache/android-sdk');
const tools=join(sdk,'build-tools/35.0.0'),jar=join(sdk,'platforms/android-35/android.jar');
const dir=join(root,'builds/android'),src=join(root,'android/app/src/main');
const javaHome=process.env.JAVA_HOME||(existsSync(join(root,'.cache/jdk21/bin/javac'))?join(root,'.cache/jdk21'):null);
const env={...process.env,...(javaHome?{JAVA_HOME:javaHome,PATH:join(javaHome,'bin')+':'+process.env.PATH}:{}),ANDROID_USER_HOME:join(root,'.cache/android-user')};
function run(bin,args,extra={}){const result=spawnSync(bin,args,{cwd:root,env:{...env,...extra},stdio:'inherit'});if(result.error)throw result.error;if(result.status)throw Error(`Falha em ${bin}: ${result.status}`);}
async function list(path,suffix){const files=[];for(const e of await readdir(path,{withFileTypes:true})){const p=join(path,e.name);if(e.isDirectory())files.push(...await list(p,suffix));else if(p.endsWith(suffix))files.push(p);}return files;}
if(!existsSync(jar)||!existsSync(tools))throw Error('SDK ausente. Instale platforms;android-35 e build-tools;35.0.0 no SDK indicado.');
await mkdir(dir,{recursive:true});await rm(join(dir,'classes'),{recursive:true,force:true});await mkdir(join(dir,'classes'),{recursive:true});await mkdir(join(dir,'dex'),{recursive:true});await mkdir(join(dir,'generated'),{recursive:true});
run(join(tools,'aapt2'),['compile','--dir',join(src,'res'),'-o',join(dir,'resources.zip')]);
run(join(tools,'aapt2'),['link','-I',jar,'--manifest',join(src,'AndroidManifest.xml'),'--java',join(dir,'generated'),'-A',join(root,'www'),'--min-sdk-version','26','--target-sdk-version','35','--version-code','1','--version-name','1.0.0','-o',join(dir,'unsigned.apk'),join(dir,'resources.zip')]);
run('javac',['--release','8','-encoding','UTF-8','-classpath',jar,'-d',join(dir,'classes'),...await list(join(src,'java'),'.java')]);
run(join(tools,'d8'),['--lib',jar,'--min-api','26','--output',join(dir,'dex'),...await list(join(dir,'classes'),'.class')]);
run('zip',['-j',join(dir,'unsigned.apk'),join(dir,'dex/classes.dex')]);
run(join(tools,'zipalign'),['-f','-p','4',join(dir,'unsigned.apk'),join(dir,'aligned.apk')]);
const signing=join(root,'android/signing');await mkdir(signing,{recursive:true});
const configFile=join(signing,'local.json'),keystore=join(signing,'paradise.p12');
let credentials;if(existsSync(configFile))credentials=JSON.parse(await readFile(configFile,'utf8'));else{credentials={password:randomBytes(24).toString('hex')};await writeFile(configFile,JSON.stringify(credentials),{mode:0o600});}
const signingEnv={PARADISE_SIGN_PASSWORD:credentials.password};
if(!existsSync(keystore))run('keytool',['-genkeypair','-keystore',keystore,'-storetype','PKCS12','-storepass:env','PARADISE_SIGN_PASSWORD','-keypass:env','PARADISE_SIGN_PASSWORD','-alias','paradise','-keyalg','RSA','-keysize','3072','-validity','10000','-dname','CN=Paradise, OU=Jogo, O=Paradise, C=BR'],signingEnv);
const apk=join(dir,'Paradise-Android.apk');
run(join(tools,'apksigner'),['sign','--ks',keystore,'--ks-key-alias','paradise','--ks-pass','env:PARADISE_SIGN_PASSWORD','--key-pass','env:PARADISE_SIGN_PASSWORD','--out',apk,join(dir,'aligned.apk')],signingEnv);
run(join(tools,'apksigner'),['verify','--verbose',apk]);
run(join(tools,'aapt2'),['dump','badging',apk]);
console.log('APK offline assinado gerado em builds/android/Paradise-Android.apk.');
