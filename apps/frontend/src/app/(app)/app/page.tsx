import { Banner } from '#/components/ui/banner'

import { NewProjectButton } from './components'
import { Projects } from './projects'

export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-14">
      <div className="space-y-8 pt-6">
        <Banner>
          Note: this is a personal/portfolio project. To keep it running
          affordably, idle environments are shut down automatically. You may hit
          cold starts or capacity limits when launching a project.
        </Banner>

        <NewProjectButton />

        <div className="space-y-4">
          <h2 className="text-xl font-medium">Projects</h2>

          <Projects />
        </div>
      </div>
    </div>
  )
}
