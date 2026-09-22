import type { Settings } from "../../domain/models";
export class AudioFeedback {
  private context: AudioContext | null = null;
  constructor(private settings: Settings) {}
  unlock() {
    if (this.settings.master > 0) {
      this.context ??= new AudioContext();
      void this.context.resume().catch(() => {});
    }
  }
  play(hit: boolean) {
    const ctx = this.context;
    if (!ctx || ctx.state !== "running") return;
    const volume =
      this.settings.master *
      (hit ? this.settings.hitVolume : this.settings.missVolume);
    if (!volume) return;
    const osc = ctx.createOscillator(),
      gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = hit ? 720 : 170;
    gain.gain.setValueAtTime(volume * 0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.07);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }
  destroy() {
    void this.context?.close().catch(() => {});
    this.context = null;
  }
}
