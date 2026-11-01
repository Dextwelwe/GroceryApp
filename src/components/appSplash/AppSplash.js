import a from './appSplash.module.css'
import { appBackgroundVars } from '../../utils/appBackground'

export default function AppSplash() {
  return (
    <div className={a.splash} style={appBackgroundVars}>
      <span className={a.spinner} aria-hidden='true' />
    </div>
  )
}
