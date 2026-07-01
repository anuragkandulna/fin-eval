import { createContext, useContext, useState, type ReactNode } from 'react'

interface SidebarContextValue {
  open: boolean
  toggle: () => void
  close: () => void
}

const SidebarContext = createContext<SidebarContextValue>({
  open: true,
  toggle: () => {},
  close: () => {},
})

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true)

  return (
    <SidebarContext.Provider value={{
      open,
      toggle: () => setOpen(o => !o),
      close: () => setOpen(false),
    }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)
