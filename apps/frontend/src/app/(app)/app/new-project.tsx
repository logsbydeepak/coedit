'use client'

import { DialogContent, DialogRoot, DialogTitle } from '#/components/ui/dialog'
import { useAppStore } from '#/store/app'

export function NewProjectDialog() {
  const isOpen = useAppStore((s) => s.dialog.newProject)
  const setDialog = useAppStore((s) => s.setDialog)

  const closeDialog = () => {
    setDialog({ newProject: false })
  }

  return (
    <DialogRoot open={isOpen} onOpenChange={closeDialog}>
      <DialogContent>
        <Content />
      </DialogContent>
    </DialogRoot>
  )
}

function Content() {
  return (
    <>
      <div>
        <DialogTitle>New Project</DialogTitle>
      </div>
    </>
  )
}
