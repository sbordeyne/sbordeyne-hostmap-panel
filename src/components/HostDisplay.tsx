import React from 'react';

interface Props extends Omit<React.SVGAttributes<SVGPolygonElement>, 'points'> {
  cx: number;
  cy: number;
  radius: number;
  isHovered?: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function getPointsForPolygonInRadius(sideCount: number, radius: number) {
  const angle = 360 / sideCount;
  const vertexIndices = Array.from(Array(sideCount).keys());;
  const offsetDeg = 90 - (180 - angle) / 2;
  const offset = degreesToRadians(offsetDeg);

  return vertexIndices.map((index) => {
    return {
      theta: offset + degreesToRadians(angle * index),
      r: radius,
    };
  });
}

function degreesToRadians(angleInDegrees: number) {
  return (Math.PI * angleInDegrees) / 180;
}

function polygon([cx, cy]: [number, number], sideCount: number, radius: number): string {
  return getPointsForPolygonInRadius(sideCount, radius)
    .map(({ r, theta }) => [cx + r * Math.cos(theta), cy + r * Math.sin(theta)])
    .join(' ');
}

export const HostDisplay: React.FC<Props> = (props: Props) => {
  const { onClick, onMouseEnter, onMouseLeave, ...rest } = props;
  const points = polygon([props.cx, props.cy], 6, props.radius);
  const hoverStrokeWidth = props.isHovered ? 3 : 1;
  const hoverOpacity = props.isHovered ? 1 : 0.7;

  const handleClick = (e: React.MouseEvent<SVGPolygonElement>) => {
    // Prevent clicks on hexagons from bubbling up to the background handler
    e.stopPropagation();
    onClick && (onClick as any)(e);
  };

  return (
    <polygon
      points={points}
      {...(rest)}
      strokeWidth={hoverStrokeWidth}
      opacity={hoverOpacity}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );
};
