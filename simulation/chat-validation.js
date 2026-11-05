// Misma validación para el chat publicado y el servidor de pruebas.
export function normalizeChatMessage(body){
 if(!body||typeof body.name!=='string'||typeof body.message!=='string')return null;
 const name=body.name.replace(/[\u0000-\u001f\u007f]/g,' ').trim();
 const message=body.message.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'').trim();
 if(!name||name.length>32||!message||message.length>500)return null;
 return {name,message};
}
