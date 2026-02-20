import * as React from "react"
import * as CmdkPrimitive from "cmdk"
import { Dialog, DialogContent, DialogPortal, DialogOverlay } from "@radix-ui/react-dialog"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

const Command = CmdkPrimitive.Command

const CommandDialog = ({
  ...props
}: React.ComponentProps<typeof Dialog>) => {
  return (
    <Dialog {...props}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" />
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
          <CmdkPrimitive.Command className="relative overflow-hidden rounded-md border bg-background p-2">
            <CmdkPrimitive.CommandInput
              placeholder="Type a command or search..."
              className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            <CmdkPrimitive.CommandList className="max-h-96 overflow-y-auto">
              <CmdkPrimitive.CommandEmpty>No results found.</CmdkPrimitive.CommandEmpty>
              <CmdkPrimitive.CommandGroup>
                <CmdkPrimitive.CommandItem>
                  <Search className="mr-2 h-4 w-4" />
                  <span>Search</span>
                </CmdkPrimitive.CommandItem>
              </CmdkPrimitive.CommandGroup>
            </CmdkPrimitive.CommandList>
          </CmdkPrimitive.Command>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CmdkPrimitive.CommandInput>,
  React.ComponentPropsWithoutRef<typeof CmdkPrimitive.CommandInput>
>(({ className, ...props }, ref) => (
  <CmdkPrimitive.CommandInput
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
))
CommandInput.displayName = CmdkPrimitive.CommandInput.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CmdkPrimitive.CommandList>,
  React.ComponentPropsWithoutRef<typeof CmdkPrimitive.CommandList>
>(({ className, ...props }, ref) => (
  <CmdkPrimitive.CommandList
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto", className)}
    {...props}
  />
))
CommandList.displayName = CmdkPrimitive.CommandList.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CmdkPrimitive.CommandEmpty>,
  React.ComponentPropsWithoutRef<typeof CmdkPrimitive.CommandEmpty>
>(({ className, ...props }, ref) => (
  <CmdkPrimitive.CommandEmpty
    ref={ref}
    className={cn("py-3 text-center text-sm text-muted-foreground", className)}
    {...props}
  />
))
CommandEmpty.displayName = CmdkPrimitive.CommandEmpty.displayName

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CmdkPrimitive.CommandSeparator>,
  React.ComponentPropsWithoutRef<typeof CmdkPrimitive.CommandSeparator>
>(({ className, ...props }, ref) => (
  <CmdkPrimitive.CommandSeparator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
CommandSeparator.displayName = CmdkPrimitive.CommandSeparator.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CmdkPrimitive.CommandItem>,
  React.ComponentPropsWithoutRef<typeof CmdkPrimitive.CommandItem>
>(({ className, ...props }, ref) => (
  <CmdkPrimitive.CommandItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  />
))
CommandItem.displayName = CmdkPrimitive.CommandItem.displayName

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CmdkPrimitive.CommandGroup>,
  React.ComponentPropsWithoutRef<typeof CmdkPrimitive.CommandGroup>
>(({ className, ...props }, ref) => (
  <CmdkPrimitive.CommandGroup
    ref={ref}
    className={cn("overflow-hidden p-1 text-foreground", className)}
    {...props}
  />
))
CommandGroup.displayName = CmdkPrimitive.CommandGroup.displayName

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
}
