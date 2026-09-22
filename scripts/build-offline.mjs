import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { createHash } from "node:crypto";
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((e) =>
        e.isDirectory() ? walk(join(dir, e.name)) : join(dir, e.name),
      ),
    )
  ).flat();
}
const paths = await walk("out");
const files = paths
  .filter((f) => !f.endsWith("sw.js") && !f.endsWith(".map"))
  // Next's catch-all chunks use bracketed directory names; the HTML requests
  // their percent-encoded URLs. Cache those exact URLs, not raw disk paths.
  .map(
    (f) =>
      "/" + relative("out", f).split(sep).map(encodeURIComponent).join("/"),
  );
const hash = createHash("sha256");
for (const f of paths) hash.update(await readFile(f));
const version = hash.digest("hex").slice(0, 12);
const sw = `const CACHE='aimforge-${version}';const FILES=${JSON.stringify(files)};self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/','/favicon.svg','/manifest.webmanifest']))));self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('aimforge-')&&k!==CACHE).map(k=>caches.delete(k))))])));self.addEventListener('message',e=>{if(e.data?.type==='ACTIVATE'){self.skipWaiting();return}if(e.data?.type==='STATUS'){e.waitUntil(caches.open(CACHE).then(async c=>e.ports[0]?.postMessage({ready:!!await c.match('/__offline_ready__')})));return}if(e.data?.type==='PREPARE'){e.waitUntil((async()=>{try{const c=await caches.open(CACHE);for(let i=0;i<FILES.length;i+=12){await c.addAll(FILES.slice(i,i+12))}await c.put('/__offline_ready__',new Response('ready'));e.ports[0]?.postMessage({ok:true})}catch{e.ports[0]?.postMessage({ok:false})}})())}});self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==self.location.origin||e.request.method!=='GET')return;e.respondWith((async()=>{const c=await caches.open(CACHE);const hit=await c.match(e.request,{ignoreSearch:true});if(hit)return hit;try{return await fetch(e.request)}catch(error){if(e.request.mode==='navigate'){const p=u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname+'/index.html';const page=await c.match(p)||await c.match('/index.html');if(page)return page}throw error}})())});`;
await writeFile("out/sw.js", sw);
console.log(
  "Offline manifest: " +
    files.length +
    " bundled resources, version " +
    version,
);
