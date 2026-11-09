"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type DropdownOption = {
  value: string;
  label: string;
  searchText?: string;
  badge?: ReactNode;
  disabled?: boolean;
  tag?: string;
};

type DropdownProps = {
  label: string;
  id?: string;
  labelId?: string;
  triggerId?: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  searchable?: boolean;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  className?: string;
  emptyMessage?: string;
  tinted?: boolean;
  triggerClassName?: string;
  panelClassName?: string;
};

function CheckIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0 text-ink"><path d="m4 10 4 4 8-8" /></svg>;
}

export default function Dropdown({
  label,
  id,
  labelId,
  triggerId,
  options,
  value,
  onChange,
  searchable = false,
  open,
  onOpen,
  onClose,
  className,
  emptyMessage = "No options match",
  tinted = false,
  triggerClassName,
  panelClassName,
}: DropdownProps) {
  const instanceId = useId().replace(/:/g, "");
  const baseId = id ?? `${instanceId}-dropdown`;
  const listboxId = `${baseId}-listbox`;
  const searchId = `${baseId}-search`;
  const resolvedLabelId = labelId ?? `${baseId}-label`;
  const resolvedTriggerId = triggerId ?? `${baseId}-trigger`;
  const panelRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const typeaheadRef = useRef("");
  const typeaheadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [search, setSearch] = useState("");
  const [activeValue, setActiveValue] = useState(value);

  const matchingOptions = searchable
    ? options.filter((option) => `${option.label} ${option.searchText ?? ""}`.toLowerCase().includes(search.toLowerCase()))
    : options;
  const enabledOptions = matchingOptions.filter((option) => !option.disabled);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      if (searchable) searchRef.current?.focus();
      else listboxRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open, searchable]);

  useEffect(() => {
    if (!open) return;
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!panelRef.current?.contains(event.target as Node)) onClose();
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [onClose, open]);

  useEffect(() => {
    if (!open || !activeValue) return;
    optionRefs.current[activeValue]?.scrollIntoView({ block: "nearest" });
  }, [activeValue, open]);

  function moveActive(direction: 1 | -1) {
    if (enabledOptions.length === 0) return;
    const currentIndex = enabledOptions.findIndex((option) => option.value === activeValue);
    const nextIndex = Math.min(enabledOptions.length - 1, Math.max(0, currentIndex < 0 ? (direction === 1 ? 0 : enabledOptions.length - 1) : currentIndex + direction));
    setActiveValue(enabledOptions[nextIndex].value);
  }

  function choose(option: DropdownOption) {
    if (option.disabled) return;
    onChange(option.value);
    onClose();
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function resetForOpen() {
    setSearch("");
    const allEnabledOptions = options.filter((option) => !option.disabled);
    setActiveValue(options.find((option) => option.value === value && !option.disabled)?.value ?? allEnabledOptions[0]?.value ?? "");
    onOpen();
  }

  function closeAndRestoreFocus() {
    onClose();
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement | HTMLDivElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveValue(enabledOptions[0]?.value ?? "");
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveValue(enabledOptions[enabledOptions.length - 1]?.value ?? "");
    } else if (event.key === "Enter") {
      event.preventDefault();
      const activeOption = options.find((option) => option.value === activeValue);
      if (activeOption) choose(activeOption);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeAndRestoreFocus();
    } else if (event.key === "Tab") {
      onClose();
    } else if (!searchable && event.key.length === 1 && /[a-z0-9]/i.test(event.key)) {
      event.preventDefault();
      typeaheadRef.current += event.key.toLowerCase();
      const match = options.find((option) => !option.disabled && option.label.toLowerCase().startsWith(typeaheadRef.current));
      if (match) setActiveValue(match.value);
      if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current);
      typeaheadTimerRef.current = setTimeout(() => { typeaheadRef.current = ""; }, 600);
    }
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) resetForOpen();
    }
  }

  return (
    <div ref={panelRef} className={`relative mt-1 min-w-0 ${className ?? ""}`}>
      <button ref={triggerRef} id={resolvedTriggerId} type="button" aria-labelledby={labelId ? `${resolvedLabelId} ${baseId}-value` : undefined} aria-label={labelId ? undefined : label} aria-haspopup="listbox" aria-expanded={open} aria-controls={listboxId} onClick={() => (open ? onClose() : resetForOpen())} onKeyDown={handleTriggerKeyDown} className={`flex min-h-11 w-full min-w-0 items-center gap-3 rounded-button border border-edge px-3 text-left text-base text-ink outline-none transition-colors hover:bg-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none ${tinted ? "bg-tint" : "bg-white"} ${triggerClassName ?? ""}`}>
        {selectedOption?.badge}
        <span id={`${baseId}-value`} className="min-w-0 flex-1 truncate">{selectedOption?.label ?? value}</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none ${open ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && <div className={`epl-team-dropdown-enter absolute left-0 top-full z-30 mt-2 w-max min-w-[max(100%,12rem)] max-w-[calc(100vw-2rem)] origin-top rounded-card border border-edge bg-white p-2 shadow-sm ${panelClassName ?? ""}`}>
        {searchable && <>
          <input ref={searchRef} id={searchId} type="text" role="combobox" value={search} placeholder={`Search ${label.toLowerCase()}`} autoComplete="off" aria-label={`Search ${label.toLowerCase()}`} aria-controls={listboxId} aria-expanded="true" aria-activedescendant={activeValue ? `${baseId}-option-${options.findIndex((option) => option.value === activeValue)}` : undefined} onChange={(event) => { setSearch(event.target.value); const query = event.target.value.toLowerCase(); const next = options.find((option) => !option.disabled && `${option.label} ${option.searchText ?? ""}`.toLowerCase().includes(query)); setActiveValue(next?.value ?? ""); }} onKeyDown={handleKeyDown} className="min-h-11 w-full rounded-button border border-border bg-white px-3 text-base text-ink outline-none placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink" />
          <div className="my-2 border-t border-border" />
        </>}
        <div ref={listboxRef} id={listboxId} role="listbox" tabIndex={searchable ? undefined : -1} aria-labelledby={labelId ? resolvedLabelId : undefined} aria-label={labelId ? undefined : label} aria-activedescendant={!searchable && activeValue ? `${baseId}-option-${options.findIndex((option) => option.value === activeValue)}` : undefined} onKeyDown={handleKeyDown} className="max-h-64 overflow-y-auto overscroll-contain">
          {matchingOptions.length > 0 ? matchingOptions.map((option) => {
            const selected = option.value === value;
            const active = option.value === activeValue;
            return <div key={option.value} ref={(element) => { optionRefs.current[option.value] = element; }} id={`${baseId}-option-${options.indexOf(option)}`} role="option" aria-selected={selected} aria-disabled={option.disabled || undefined} onPointerDown={(event) => { if (!option.disabled) event.preventDefault(); }} onClick={() => choose(option)} onMouseEnter={() => { if (!option.disabled) setActiveValue(option.value); }} className={`flex min-h-11 items-center gap-3 rounded-button px-2 text-base ${option.disabled ? "cursor-not-allowed text-muted opacity-60" : `cursor-pointer text-ink ${active || selected ? "bg-tint" : "hover:bg-tint"}`}`}>
              {option.badge}
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {option.disabled && option.tag ? <span className="shrink-0 text-xs text-muted">{option.tag}</span> : selected ? <CheckIcon /> : null}
            </div>;
          }) : <div role="status" className="px-2 py-3 text-base text-muted">{emptyMessage}</div>}
        </div>
      </div>}
    </div>
  );
}
