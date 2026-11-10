import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {dirname} from 'node:path';
export async function localWorldStore(path,initial){
 let row;try{row=JSON.parse(await readFile(path,'utf8'))}catch(error){if(error.code!=='ENOENT')throw error;row={version:0,state:initial}}
 let queue=Promise.resolve();
 return {
  read:async()=>{await queue;return structuredClone(row)},
  write:(expected,state)=>{
   const operation=queue.then(async()=>{if(row.version!==expected)return false;const next={version:row.version+1,state:structuredClone(state)};await mkdir(dirname(path),{recursive:true});await writeFile(path+'.tmp',JSON.stringify(next));await rename(path+'.tmp',path);row=next;return true});queue=operation.catch(()=>{});return operation;
  }
 };
}
