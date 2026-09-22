export async function prepareOffline() {
  if (!("serviceWorker" in navigator)) throw new Error("offlineUnavailable");
  const registration = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
  });
  await navigator.serviceWorker.ready;
  const worker = registration.active;
  if (!worker) throw new Error("offlineUnavailable");
  return new Promise<void>((resolve, reject) => {
    const channel = new MessageChannel(),
      timer = setTimeout(() => reject(new Error("offlineFailed")), 120000);
    channel.port1.onmessage = (e) => {
      clearTimeout(timer);
      if (e.data?.ok) resolve();
      else reject(new Error("offlineFailed"));
    };
    worker.postMessage({ type: "PREPARE" }, [channel.port2]);
  });
}
export async function offlineStatus() {
  if (!("serviceWorker" in navigator)) return false;
  const r = await navigator.serviceWorker.getRegistration();
  if (!r?.active) return false;
  return new Promise<boolean>((resolve) => {
    const c = new MessageChannel(),
      timer = setTimeout(() => resolve(false), 3000);
    c.port1.onmessage = (e) => {
      clearTimeout(timer);
      resolve(e.data?.ready === true);
    };
    r.active!.postMessage({ type: "STATUS" }, [c.port2]);
  });
}
