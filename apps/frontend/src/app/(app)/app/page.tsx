import { NewProjectButton } from './components'

const projects = [
  {
    name: 'project-1',
  },
  {
    name: 'project-2',
  },
  {
    name: 'project-3',
  },
  {
    name: 'project-4',
  },
  {
    name: 'project-5',
  },
  {
    name: 'project-6',
  },
]

export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-5 pt-14">
      <div className="space-y-8 pt-6">
        <NewProjectButton />

        <div className="space-y-4">
          <h2 className="text-xl font-medium">Projects</h2>
          <div className="grid grid-cols-3 gap-6">
            {projects.map((project) => (
              <Project key={project.name} name={project.name} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface Project {
  name: string
}

function Project({ name }: Project) {
  return (
    <div className="rounded-md border border-gray-4 p-4">
      <p className="text-sm font-medium">{name}</p>
    </div>
  )
}
