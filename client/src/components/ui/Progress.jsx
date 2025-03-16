import React from 'react';

export const Progress = ({ value = 0, className = '', showLabel = true }) => {
  // 确保value在0-100之间
  const clampedValue = Math.min(Math.max(value, 0), 100);
  
  return (
    <div className="relative pt-1">
      {showLabel && (
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
              进度
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold inline-block text-indigo-600">
              {clampedValue}%
            </span>
          </div>
        </div>
      )}
      <div className={`overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200 ${className}`}>
        <div
          style={{ width: `${clampedValue}%` }}
          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
        ></div>
      </div>
    </div>
  );
}; 