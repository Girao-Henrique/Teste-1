const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('ParadiseDesktop',{platform:process.platform,exitGame:()=>ipcRenderer.invoke('app:quit'),exportSave:json=>ipcRenderer.invoke('save:export',json)});
