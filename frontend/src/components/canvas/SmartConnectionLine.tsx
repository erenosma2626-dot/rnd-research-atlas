import React from 'react';
import { ConnectionLineComponentProps, getSmoothStepPath, Position } from 'reactflow';

export const SmartConnectionLine: React.FC<ConnectionLineComponentProps> = ({
  fromX,
  fromY,
  fromPosition,
  toX,
  toY,
  connectionLineStyle,
}) => {
  const dx = toX - fromX;
  const dy = toY - fromY;

  const isTargetAbove = dy < -20;
  const isTargetBelow = dy > 20;

  let targetPosition: Position;
  let sourcePosition = fromPosition;

  if (isTargetAbove) {
    // Yukarı çekiliyorsa: Ok ucu YUKARI baksın
    targetPosition = Position.Bottom;
    if (Math.abs(dy) > Math.abs(dx) * 1.3) {
      sourcePosition = Position.Top;
    } else {
      sourcePosition = dx >= 0 ? Position.Right : Position.Left;
    }
  } else if (isTargetBelow) {
    // Aşağı çekiliyorsa: Ok ucu AŞAĞI baksın
    targetPosition = Position.Top;
    if (Math.abs(dy) > Math.abs(dx) * 1.3) {
      sourcePosition = Position.Bottom;
    } else {
      sourcePosition = dx >= 0 ? Position.Right : Position.Left;
    }
  } else {
    // Yatay
    targetPosition = dx >= 0 ? Position.Left : Position.Right;
    sourcePosition = dx >= 0 ? Position.Right : Position.Left;
  }

  const [edgePath] = getSmoothStepPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition,
    targetX: toX,
    targetY: toY,
    targetPosition,
    borderRadius: 8,
  });

  const strokeColor = connectionLineStyle?.stroke || '#71717A';

  return (
    <g>
      <defs>
        <marker
          id="connection-arrow"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={strokeColor} />
        </marker>
      </defs>
      <path
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2}
        strokeDasharray="4 4"
        markerEnd="url(#connection-arrow)"
      />
    </g>
  );
};
