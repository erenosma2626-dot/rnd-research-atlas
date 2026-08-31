import React, { createContext, useContext, useState } from 'react';
import { ShapeType } from './ShapeNode';

export type ToolMode = 'select' | 'pen' | 'eraser' | 'shape' | 'text';

interface ToolModeContextType {
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
  activeShapeType: ShapeType;
  setActiveShapeType: (shape: ShapeType) => void;
  activeColor: string;
  setActiveColor: (color: string) => void;
}

const ToolModeContext = createContext<ToolModeContextType>({
  toolMode: 'select',
  setToolMode: () => {},
  activeShapeType: 'rectangle',
  setActiveShapeType: () => {},
  activeColor: 'neutral',
  setActiveColor: () => {},
});

export const ToolModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [activeShapeType, setActiveShapeType] = useState<ShapeType>('rectangle');
  const [activeColor, setActiveColor] = useState<string>('neutral');

  return (
    <ToolModeContext.Provider
      value={{
        toolMode,
        setToolMode,
        activeShapeType,
        setActiveShapeType,
        activeColor,
        setActiveColor,
      }}
    >
      {children}
    </ToolModeContext.Provider>
  );
};

export const useToolMode = () => useContext(ToolModeContext);
