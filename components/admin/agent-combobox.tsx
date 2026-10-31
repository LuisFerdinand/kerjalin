"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { TreeNodeData } from "@/lib/queries/admin";

/** Memilih sponsor/parent. value "root" = langsung di bawah Kerjalin. Mengirim nilai lewat input tersembunyi. */
export function AgentCombobox({
  name,
  nodes,
  defaultValue = "root",
  excludeIds,
  allowRoot = true,
  rootLabel = "Langsung di bawah Kerjalin",
  disabled,
}: {
  name: string;
  nodes: TreeNodeData[];
  defaultValue?: string;
  excludeIds?: Set<string>;
  allowRoot?: boolean;
  rootLabel?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);

  const options = useMemo(() => nodes.filter((n) => !excludeIds?.has(n.id)), [nodes, excludeIds]);
  const selected = options.find((n) => n.id === value);

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="h-10 w-full justify-between bg-background px-3 font-normal"
          >
            <span className="flex min-w-0 items-center gap-2">
              {selected ? (
                <>
                  <span className="truncate font-medium">{selected.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{selected.levelName}</span>
                </>
              ) : (
                <>
                  <Crown className="size-4 text-warning" />
                  <span className="truncate">{rootLabel}</span>
                </>
              )}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] min-w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Cari nama, email, atau kode..." />
            <CommandList>
              <CommandEmpty>Agen tidak ditemukan.</CommandEmpty>
              <CommandGroup>
                {allowRoot && (
                  <CommandItem
                    value="kerjalin root langsung"
                    onSelect={() => {
                      setValue("root");
                      setOpen(false);
                    }}
                  >
                    <Crown className="text-warning" />
                    <span className="flex-1">{rootLabel}</span>
                    <Check className={cn("size-4", value === "root" ? "opacity-100" : "opacity-0")} />
                  </CommandItem>
                )}
                {options.map((n) => {
                  const full = n.slots !== null && n.directCount >= n.slots;
                  return (
                    <CommandItem
                      key={n.id}
                      value={`${n.name} ${n.email} ${n.referralCode}`}
                      onSelect={() => {
                        setValue(n.id);
                        setOpen(false);
                      }}
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: n.levelColor }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{n.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {n.levelName} · {n.directCount}/{n.slots ?? "∞"} slot
                          {full && " (penuh)"}
                        </span>
                      </span>
                      <Check className={cn("size-4", value === n.id ? "opacity-100" : "opacity-0")} />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
