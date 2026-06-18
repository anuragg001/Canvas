import React from 'react'

const WorkspaceClient = () => {
  return (
    <div className ="flex h-[calc(100vh-4rem)] overflow-hidden bg-[#0a0a0a] ">
        
        {/* chat panel */}
        <div className = "w-[320px] shrink-0 border-r border-white/6 bg-[#0d0d0d] flex items-center justify-center ">
        <p className = "text-xs text-white/20 ">
            Chat Panel
        </p>
        </div>

        {/* code panel */}
        <div className = "flex flex-1 overflow-hidden items-center justify-center">
            <p className = "text-xs text-white/20">
                Code Panel
            </p>
        </div>
    </div>
  )
}

export default WorkspaceClient