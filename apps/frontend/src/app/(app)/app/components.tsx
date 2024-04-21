'use client'

import { Button } from '#/components/ui/button'
import { useAppStore } from '#/store/app'

export function NewProjectButton() {
  const setDialog = useAppStore((s) => s.setDialog)

  return (
    <div className="mx-auto flex h-44 max-w-xl items-center justify-center rounded-md border border-dashed border-gray-6 bg-gray-3">
      <Button onClick={() => setDialog({ newProject: true })}>
        New Project
      </Button>
    </div>
  )
}
