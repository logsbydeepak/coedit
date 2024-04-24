import { NewProjectButton } from './components'
import { Projects } from './projects'

export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-14">
      <div className="space-y-8 pt-6">
        <NewProjectButton />

        <div className="space-y-4">
          <h2 className="text-xl font-medium">Projects</h2>

          <Projects />
        </div>
      </div>
    </div>
  )
}
