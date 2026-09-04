import React from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath, Position } from 'reactflow';

export const SmartOrientedEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition: _sourcePosition,
  targetPosition: _targetPosition,
  style = {},
  markerEnd,
  label,
  labelStyle,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
}) => {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;

  // Horizontal threshold:
  // Eğer yatay hizadan yukarıda bi yere gidiyorsa baktığı yön yukarı dönsün (Position.Bottom)
  // Eğer aşağıdaysa baktığı yön aşağı dönsün (Position.Top)
  const isTargetAbove = dy < -25;
  const isTargetBelow = dy > 25;

  let computedTargetPos: Position;
  let computedSourcePos: Position;

  if (isTargetAbove) {
    // Hedef yukarıda: Ok YUKARI bakmalı (aşağıdan girer)
    computedTargetPos = Position.Bottom;
    if (Math.abs(dy) > Math.abs(dx) * 1.3) {
      computedSourcePos = Position.Top;
    } else {
      computedSourcePos = dx >= 0 ? Position.Right : Position.Left;
    }
  } else if (isTargetBelow) {
    // Hedef aşağıda: Ok AŞAĞI bakmalı (yukarıdan girer)
    computedTargetPos = Position.Top;
    if (Math.abs(dy) > Math.abs(dx) * 1.3) {
      computedSourcePos = Position.Bottom;
    } else {
      computedSourcePos = dx >= 0 ? Position.Right : Position.Left;
    }
  } else {
    // Yatay hizada: Sağa veya sola bakar
    computedTargetPos = dx >= 0 ? Position.Left : Position.Right;
    computedSourcePos = dx >= 0 ? Position.Right : Position.Left;
  }

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition: computedSourcePos,
    targetX,
    targetY,
    targetPosition: computedTargetPos,
    borderRadius: 8,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      labelX={labelX}
      labelY={labelY}
      label={label}
      labelStyle={labelStyle}
      labelShowBg={Boolean(label)}
      labelBgStyle={labelBgStyle}
      labelBgPadding={labelBgPadding || [6, 4]}
      labelBgBorderRadius={labelBgBorderRadius || 6}
      style={style}
      markerEnd={markerEnd}
    />
  );
};
