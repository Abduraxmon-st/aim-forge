import {
  Children,
  Fragment,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";

type Change = { target: { value: string } };
type Option = {
  value: string;
  label: ReactNode;
  text: string;
  disabled?: boolean;
};
function plainText(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) =>
      isValidElement<{ children?: ReactNode }>(child)
        ? plainText(child.props.children)
        : String(child),
    )
    .join("");
}
function readOptions(children: ReactNode): Option[] {
  return Children.toArray(children).flatMap((child) => {
    if (
      !isValidElement<{
        children?: ReactNode;
        value?: string | number;
        disabled?: boolean;
      }>(child)
    )
      return [];
    if (child.type === Fragment) return readOptions(child.props.children);
    return [
      {
        value: String(child.props.value ?? plainText(child.props.children)),
        label: child.props.children,
        text: plainText(child.props.children),
        disabled: child.props.disabled,
      },
    ];
  });
}

function usePopover(
  open: boolean,
  trigger: RefObject<HTMLButtonElement | null>,
  panel: RefObject<HTMLDivElement | null>,
  close: () => void,
  width?: number,
) {
  const [style, setStyle] = useState<CSSProperties>({
    position: "fixed",
    top: 0,
    left: 0,
    visibility: "hidden",
  });
  const closeRef = useRef(close);
  closeRef.current = close;
  useLayoutEffect(() => {
    if (!open) return;
    const position = () => {
      if (!trigger.current || !panel.current) return;
      const rect = trigger.current.getBoundingClientRect();
      const popupWidth = Math.min(
        width ?? Math.max(rect.width, 210),
        window.innerWidth - 24,
      );
      const below = window.innerHeight - rect.bottom - 20;
      const flip =
        below < Math.min(panel.current.scrollHeight, 330) && rect.top > below;
      setStyle({
        position: "fixed",
        width: popupWidth,
        left: Math.max(
          12,
          Math.min(rect.left, window.innerWidth - popupWidth - 12),
        ),
        top: flip ? rect.top - 8 : rect.bottom + 8,
        maxHeight: Math.max(100, flip ? rect.top - 20 : below),
        transform: flip ? "translateY(-100%)" : undefined,
        transformOrigin: flip ? "bottom left" : "top left",
      });
    };
    const outside = (event: PointerEvent) => {
      if (
        !trigger.current?.contains(event.target as Node) &&
        !panel.current?.contains(event.target as Node)
      )
        closeRef.current();
    };
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    document.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open, trigger, panel, width]);
  return style;
}

export function Select({
  value,
  children,
  onChange,
  disabled,
  className = "",
  ...label
}: {
  value: string | number;
  children: ReactNode;
  onChange: (event: Change) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}) {
  const id = useId(),
    options = readOptions(children);
  const selected = options.findIndex(
    (option) => option.value === String(value),
  );
  const [open, setOpen] = useState(false),
    [active, setActive] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null),
    panel = useRef<HTMLDivElement>(null);
  const search = useRef({ text: "", time: 0 });
  const style = usePopover(open, trigger, panel, () => setOpen(false));
  const choose = (index: number) => {
    const option = options[index];
    if (!option || option.disabled) return;
    onChange({ target: { value: option.value } });
    setOpen(false);
    trigger.current?.focus();
  };
  const show = () => {
    setActive(Math.max(0, selected));
    setOpen(true);
  };
  useEffect(() => {
    if (!open || !panel.current) return;
    const menu = panel.current;
    const option = menu.querySelector<HTMLElement>(`[data-index="${active}"]`);
    if (!option) return;
    // scrollIntoView also scrolls ancestors, including the page when a portal
    // first mounts. Only move this menu's own scroll position.
    const top = option.offsetTop,
      bottom = top + option.offsetHeight;
    if (top < menu.scrollTop) menu.scrollTop = top;
    else if (bottom > menu.scrollTop + menu.clientHeight)
      menu.scrollTop = bottom - menu.clientHeight;
  }, [active, open]);
  return (
    <span className={"custom-select " + className}>
      <button
        {...label}
        type="button"
        className="control-trigger"
        role="combobox"
        ref={trigger}
        disabled={disabled || !options.length}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? id : undefined}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
            return;
          }
          if (event.key === "Tab") {
            setOpen(false);
            return;
          }
          if (["Enter", " "].includes(event.key)) {
            event.preventDefault();
            if (open) choose(active);
            else show();
            return;
          }
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            if (!open) {
              show();
              return;
            }
            const direction =
              event.key === "ArrowUp" || event.key === "End" ? -1 : 1;
            let next =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? options.length - 1
                  : (active + direction + options.length) % options.length;
            for (let i = 0; i < options.length && options[next].disabled; i++)
              next = (next + direction + options.length) % options.length;
            setActive(next);
          } else if (
            event.key.length === 1 &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey
          ) {
            event.preventDefault();
            const now = Date.now();
            search.current.text =
              (now - search.current.time > 700 ? "" : search.current.text) +
              event.key.toLocaleLowerCase();
            search.current.time = now;
            const next = options.findIndex(
              (option) =>
                !option.disabled &&
                option.text.toLocaleLowerCase().startsWith(search.current.text),
            );
            if (next >= 0) {
              setOpen(true);
              setActive(next);
            }
          }
        }}
      >
        <span className="control-value">{options[selected]?.label ?? "—"}</span>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={open ? "control-chevron open" : "control-chevron"}
        />
      </button>
      {open &&
        createPortal(
          <div
            ref={panel}
            id={id}
            role="listbox"
            aria-label={label["aria-label"]}
            className="control-popover select-options"
            style={style}
            onMouseDown={(event) => event.preventDefault()}
          >
            {options.map((option, index) => (
              <div
                role="option"
                id={`${id}-${index}`}
                data-index={index}
                key={option.value}
                aria-selected={index === selected}
                aria-disabled={option.disabled || undefined}
                className={
                  "select-option " + (active === index ? "highlighted" : "")
                }
                onPointerMove={() => !option.disabled && setActive(index)}
                onClick={() => choose(index)}
              >
                <span>{option.label}</span>
                <Check
                  size={15}
                  aria-hidden="true"
                  className={index === selected ? "" : "invisible"}
                />
              </div>
            ))}
          </div>,
          document.body,
        )}
    </span>
  );
}

export function RadioGroup({
  label,
  value,
  options,
  onValueChange,
  disabled,
  variant = "cards",
}: {
  label: string;
  value: string | number;
  options: { value: string | number; label: ReactNode }[];
  onValueChange: (value: string) => void;
  disabled?: boolean;
  variant?: "cards" | "segmented";
}) {
  const name = useId();
  return (
    <div
      className={"radio-group radio-group-" + variant}
      role="radiogroup"
      aria-label={label}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={
            "radio-option " +
            (String(option.value) === String(value) ? "selected" : "")
          }
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={String(option.value) === String(value)}
            disabled={disabled}
            onChange={() => onValueChange(String(option.value))}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const parseDate = (value: string) =>
  value ? new Date(value + "T12:00:00") : new Date();
export function DatePicker({
  value,
  onChange,
  min,
  max,
  "aria-label": label,
}: {
  value: string;
  onChange: (event: Change) => void;
  min?: string;
  max?: string;
  "aria-label": string;
}) {
  const { t, i18n } = useTranslation(),
    id = useId();
  const [open, setOpen] = useState(false),
    [view, setView] = useState(() => parseDate(value)),
    [focused, setFocused] = useState(() => value || dateKey(new Date()));
  const trigger = useRef<HTMLButtonElement>(null),
    panel = useRef<HTMLDivElement>(null);
  const style = usePopover(open, trigger, panel, () => setOpen(false), 316);
  const today = dateKey(new Date()),
    first = new Date(view.getFullYear(), view.getMonth(), 1, 12);
  const offset = (first.getDay() + 6) % 7;
  const allowed = (key: string) => (!min || key >= min) && (!max || key <= max);
  const dateFormat = new Intl.DateTimeFormat(i18n.language, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const longFormat = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: "full",
  });
  const focusDay = (key: string) =>
    requestAnimationFrame(() =>
      panel.current
        ?.querySelector<HTMLButtonElement>(`[data-date="${key}"]`)
        ?.focus(),
    );
  const choose = (key: string) => {
    onChange({ target: { value: key } });
    setOpen(false);
    trigger.current?.focus();
  };
  const shiftMonth = (amount: number) => {
    const next = new Date(view.getFullYear(), view.getMonth() + amount, 1, 12);
    setView(next);
    setFocused(dateKey(next));
  };
  return (
    <span className="custom-date">
      <button
        type="button"
        ref={trigger}
        className={"control-trigger " + (!value ? "placeholder" : "")}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          const initial =
            value ||
            (min && today < min ? min : max && today > max ? max : today);
          setView(parseDate(initial));
          setFocused(initial);
          setOpen(true);
          focusDay(initial);
        }}
      >
        <CalendarDays size={16} aria-hidden="true" />
        <span className="control-value">
          {value ? dateFormat.format(parseDate(value)) : label}
        </span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={"control-chevron " + (open ? "open" : "")}
        />
      </button>
      {open &&
        createPortal(
          <div
            id={id}
            ref={panel}
            role="dialog"
            aria-label={label}
            className="control-popover calendar-popover"
            style={style}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                setOpen(false);
                trigger.current?.focus();
              }
            }}
            onBlur={(event) => {
              if (
                event.relatedTarget &&
                event.relatedTarget !== trigger.current &&
                !event.currentTarget.contains(event.relatedTarget as Node)
              )
                setOpen(false);
            }}
          >
            <div className="calendar-heading">
              <button
                type="button"
                aria-label={t("control-previousYear")}
                onClick={() => shiftMonth(-12)}
              >
                <ChevronsLeft size={15} />
              </button>
              <button
                type="button"
                aria-label={t("control-previousMonth")}
                onClick={() => shiftMonth(-1)}
              >
                <ChevronLeft size={16} />
              </button>
              <strong aria-live="polite">
                {new Intl.DateTimeFormat(i18n.language, {
                  month: "long",
                  year: "numeric",
                }).format(view)}
              </strong>
              <button
                type="button"
                aria-label={t("control-nextMonth")}
                onClick={() => shiftMonth(1)}
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                aria-label={t("control-nextYear")}
                onClick={() => shiftMonth(12)}
              >
                <ChevronsRight size={15} />
              </button>
            </div>
            <div className="calendar-weekdays" aria-hidden="true">
              {Array.from({ length: 7 }, (_, index) => (
                <span key={index}>
                  {new Intl.DateTimeFormat(i18n.language, {
                    weekday: "narrow",
                  }).format(new Date(2024, 0, index + 1))}
                </span>
              ))}
            </div>
            <div
              className="calendar-days"
              key={`${view.getFullYear()}-${view.getMonth()}`}
              role="group"
              aria-label={t("control-chooseDate")}
            >
              {Array.from({ length: 42 }, (_, index) => {
                const day = new Date(
                    first.getFullYear(),
                    first.getMonth(),
                    1 + index - offset,
                    12,
                  ),
                  key = dateKey(day);
                return (
                  <button
                    type="button"
                    key={key}
                    data-date={key}
                    disabled={!allowed(key)}
                    aria-label={longFormat.format(day)}
                    aria-pressed={key === value}
                    aria-current={key === today ? "date" : undefined}
                    tabIndex={key === focused ? 0 : -1}
                    className={
                      (day.getMonth() !== view.getMonth() ? "outside " : "") +
                      (key === value ? "selected " : "") +
                      (key === today ? "today" : "")
                    }
                    onClick={() => choose(key)}
                    onFocus={() => setFocused(key)}
                    onKeyDown={(event) => {
                      const delta: Record<string, number> = {
                        ArrowLeft: -1,
                        ArrowRight: 1,
                        ArrowUp: -7,
                        ArrowDown: 7,
                        Home: -(day.getDay() + 6) % 7,
                        End: 6 - ((day.getDay() + 6) % 7),
                      };
                      let next: Date;
                      if (event.key in delta)
                        next = new Date(
                          day.getFullYear(),
                          day.getMonth(),
                          day.getDate() + delta[event.key],
                          12,
                        );
                      else if (
                        event.key === "PageUp" ||
                        event.key === "PageDown"
                      ) {
                        const month =
                          day.getMonth() +
                          (event.key === "PageUp" ? -1 : 1) *
                            (event.shiftKey ? 12 : 1);
                        const last = new Date(
                          day.getFullYear(),
                          month + 1,
                          0,
                        ).getDate();
                        next = new Date(
                          day.getFullYear(),
                          month,
                          Math.min(day.getDate(), last),
                          12,
                        );
                      } else return;
                      event.preventDefault();
                      const nextKey = dateKey(next);
                      if (!allowed(nextKey)) return;
                      setView(next);
                      setFocused(nextKey);
                      focusDay(nextKey);
                    }}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
            <div className="calendar-footer">
              <button type="button" onClick={() => choose("")}>
                {t("control-clear")}
              </button>
              <button
                type="button"
                disabled={!allowed(today)}
                onClick={() => choose(today)}
              >
                {t("control-today")}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </span>
  );
}
