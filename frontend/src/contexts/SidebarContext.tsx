import { createContext, useContext, useState, type ReactNode } from 'react'

interface SidebarContextValue {
  open: boolean
  openSidebar: () => void
  toggle: () => void
  close: () => void
}

const SidebarContext = createContext<SidebarContextValue>({
  open: true,
  openSidebar: () => {},
  toggle: () => {},
  close: () => {},
})

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1480 : true
  )

  return (
    <SidebarContext.Provider value={{
      open,
      openSidebar: () => setOpen(true),
      toggle: () => setOpen(o => !o),
      close: () => setOpen(false),
    }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)
