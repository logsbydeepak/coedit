'use client'

import { useQuery } from '@tanstack/react-query'

import { apiClient } from '#/utils/hc-client'

export function Projects() {
  const { isLoading, data } = useQuery({
    queryFn: async () => {
      const res = await apiClient.project.$get()
      return await res.json()
    },
    queryKey: ['projects'],
    throwOnError: true,
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!data) {
    return <div>Something went wrong</div>
  }

  if (data.projects.length === 0) {
    return <div>No projects found</div>
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {data.projects.map((project: Project) => (
        <Project key={project.id} name={project.name} id={project.id} />
      ))}
    </div>
  )
}

interface Project {
  name: string
  id: string
}

function Project({ name }: Project) {
  return (
    <div className="rounded-md border border-gray-4 p-4">
      <p className="text-sm font-medium">{name}</p>
    </div>
  )
}
