import React from 'react'
import './TabHostApp.css'

const TabHostApp: React.FC = () => {
  // Since the BrowserView is now managed by the main process and covers this entire area,
  // this component no longer needs to render anything or manage any state.
  // It only serves as a host for the BrowserView.
  return <div className="tab-host-app-container"></div>
}

export default TabHostApp