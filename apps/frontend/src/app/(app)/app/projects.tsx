'use client'

import React, { HtmlHTMLAttributes } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PencilIcon, PlayIcon, TrashIcon } from 'lucide-react'

import { apiClient } from '#/utils/hc-client'
import { cn } from '#/utils/style'

export function Projects() {
  const { isLoading, data } = useQuery({
    queryFn: async () => {
      const res = await apiClient.project.$get()
      return await res.json()
    },

    queryKey: ['projects'],
  })

  if (isLoading) {
    return (
      <Grid>
        {Array.from({ length: 6 }, (_, i) => (
          <Loading key={i} />
        ))}
      </Grid>
    )
  }

  if (!data) {
    return <Message className="text-red-11">error</Message>
  }

  if (data.projects.length === 0) {
    return <Message>No projects found</Message>
  }

  return (
    <Grid>
      {data.projects.map((project: Project) => (
        <Project key={project.id} name={project.name} id={project.id} />
      ))}
    </Grid>
  )
}

function Message({
  className,
  children,
}: HtmlHTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'p-10 text-center font-mono text-sm font-medium text-gray-11',
        className
      )}
    >
      {children}
    </p>
  )
}

interface Project {
  name: string
  id: string
}

function Project({ name }: Project) {
  const actions = [
    {
      name: 'Play',
      Icon: PlayIcon,
      onClick: () => {},
    },
    {
      name: 'Delete',
      Icon: TrashIcon,
      onClick: () => {},
    },
    {
      name: 'Edit',
      Icon: PencilIcon,
      onClick: () => {},
    },
  ]

  return (
    <ProjectContainer>
      <p className="p-4 font-mono text-sm font-medium">{name}</p>

      <div className="flex justify-between divide-x divide-gray-4 border-t border-gray-4">
        {actions.map((a) => (
          <ActionButton key={a.name} onClick={a.onClick}>
            <a.Icon className="size-4" />
          </ActionButton>
        ))}
      </div>
    </ProjectContainer>
  )
}

function ProjectContainer({
  children,
  className,
}: HtmlHTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex h-24 w-full flex-col rounded-md border border-gray-4',
        className
      )}
    >
      {children}
    </div>
  )
}

function Loading() {
  return (
    <ProjectContainer className="animate-pulse bg-gray-4"></ProjectContainer>
  )
}

function ActionButton({
  children,
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className="flex size-6 h-10 w-full items-center justify-center  text-gray-11 hover:bg-gray-3 hover:text-gray-12">
      {children}
    </button>
  )
}

function Grid({ children }: React.PropsWithChildren) {
  return <div className="grid grid-cols-3 gap-6">{children}</div>
}
