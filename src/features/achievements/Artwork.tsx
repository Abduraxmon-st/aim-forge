import type { CSSProperties } from "react";
import {
  Award,
  CalendarCheck2,
  Clock3,
  Compass,
  Crown,
  Crosshair,
  Eclipse,
  Flag,
  Flame,
  Footprints,
  Gem,
  Ghost,
  Hourglass,
  Layers3,
  LockKeyhole,
  Medal,
  Orbit,
  Repeat2,
  RotateCcw,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { AchievementId } from "../../domain/achievements";

export const achievementArt: Record<
  AchievementId,
  { icon: LucideIcon; color: string }
> = {
  first: { icon: Footprints, color: "#b4a1fa" },
  ten: { icon: Layers3, color: "#ab9efa" },
  fifty: { icon: Medal, color: "#e6b77d" },
  hundred: { icon: Crown, color: "#efd195" },
  "warmup-time": { icon: Timer, color: "#85cdd7" },
  hour: { icon: Hourglass, color: "#82bded" },
  "five-hours": { icon: Clock3, color: "#a0aeff" },
  routine: { icon: Repeat2, color: "#8acfb5" },
  "routines-five": { icon: Orbit, color: "#80ccbe" },
  seven: { icon: CalendarCheck2, color: "#d3a1e7" },
  "streak-three": { icon: Flame, color: "#e5aa8b" },
  "streak-seven": { icon: Award, color: "#f0be87" },
  "first-win": { icon: Flag, color: "#97d5b3" },
  "ten-wins": { icon: Trophy, color: "#e5c688" },
  precision: { icon: Crosshair, color: "#a6b1fb" },
  combo: { icon: Target, color: "#d89bad" },
  tracking: { icon: Waves, color: "#7bced0" },
  reaction: { icon: Zap, color: "#efd183" },
  explorer: { icon: Compass, color: "#89bcea" },
  "all-modes": { icon: Eclipse, color: "#bca3f0" },
  ghost: { icon: Ghost, color: "#c9b9f6" },
  "still-water": { icon: Waves, color: "#89dddb" },
  "second-wind": { icon: RotateCcw, color: "#9ad5b1" },
  "parallel-worlds": { icon: Eclipse, color: "#bda7f7" },
  prism: { icon: Gem, color: "#e3a7ce" },
};

export function AchievementEmblem({
  id,
  earned = false,
  hidden = false,
  small = false,
  large = false,
}: {
  id: AchievementId;
  earned?: boolean;
  hidden?: boolean;
  small?: boolean;
  large?: boolean;
}) {
  const art = achievementArt[id],
    Icon = hidden ? LockKeyhole : art.icon;
  return (
    <span
      className={
        "achievement-emblem" +
        (earned ? " earned" : "") +
        (hidden ? " concealed" : "") +
        (small ? " small" : "") +
        (large ? " large" : "")
      }
      style={
        { "--badge-color": hidden ? "#b0a2d5" : art.color } as CSSProperties
      }
      aria-hidden="true"
    >
      <span className="emblem-outline" />
      <span className="emblem-face" />
      <span className="emblem-orbit" />
      <Icon
        className="emblem-glyph"
        size={small ? 21 : large ? 42 : 30}
        strokeWidth={1.55}
      />
      {earned && (
        <Sparkles
          className="emblem-spark"
          size={small ? 9 : large ? 18 : 13}
          strokeWidth={1.5}
        />
      )}
    </span>
  );
}
