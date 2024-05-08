import { fileExplorerRoute } from './route/fileExplorer'
import { h } from './utils/h'

const route = h.route('/fileExplorer', fileExplorerRoute)

export const app = h.route('/api', route)
export type AppType = typeof app
