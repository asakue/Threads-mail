import React from 'react';

interface DeviceShellProps {
  children: React.ReactNode;
  isDeviceMode: boolean;
  isDarkMode: boolean;
}

export const DeviceShell: React.FC<DeviceShellProps> = ({
  children,
  isDeviceMode,
  isDarkMode,
}) => {
  if (!isDeviceMode) {
    // Fullscreen responsive container
    return (
      <div className={`w-full max-w-4xl mx-auto h-[calc(100vh-80px)] rounded-2xl overflow-hidden shadow-2xl border border-vibery-border ${
        isDarkMode ? 'bg-vibery-dark text-white' : 'bg-white text-black'
      }`}>
        {children}
      </div>
    );
  }

  // Realistic iPhone 16 Pro titanium device frame
  return (
    <div className="flex justify-center items-center py-6">
      <div
        className={`device-shell ${
          isDarkMode ? 'bg-vibery-dark text-white' : 'bg-white text-black'
        }`}
      >
        {/* Dynamic Island */}
        <div className="dynamic-island">
          <span className="text-[9px] text-zinc-400 font-mono">9:41</span>
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-800 border border-zinc-700"></div>
        </div>

        {/* iOS Status Bar Spacer */}
        <div className="h-11 w-full pt-2.5 px-7 flex justify-between items-center text-[11px] font-semibold flex-shrink-0">
          <span>9:41</span>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <i className="ph-bold ph-wifi-high"></i>
            <i className="ph-bold ph-battery-charging text-sm"></i>
          </div>
        </div>

        {/* Screen Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>

        {/* iOS Home Indicator */}
        <div className="h-4 w-full flex justify-center items-center pb-1 flex-shrink-0 bg-vibery-dark">
          <div className="w-32 h-1 bg-white/30 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
