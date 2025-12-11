"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface CreatableSelectProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function CreatableSelect({ options, value, onChange, placeholder }: CreatableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  
  const filteredOptions = React.useMemo(() => 
    options.filter(option => option.toLowerCase().includes(inputValue.toLowerCase()))
  , [options, inputValue]);

  const handleSelect = (currentValue: string) => {
    onChange(currentValue === value ? "" : currentValue);
    setInputValue("");
    setOpen(false)
  }

  const handleCreate = () => {
    if (inputValue) {
        onChange(inputValue);
        setInputValue("");
        setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value
            ? value
            : placeholder || "Select an option..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command>
          <CommandInput 
            placeholder="Search or create new..."
            value={inputValue}
            onValueChange={setInputValue}
           />
          <CommandList>
            <CommandEmpty>
                <Button variant="ghost" className="w-full justify-start" onClick={handleCreate}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create "{inputValue}"
                </Button>
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
