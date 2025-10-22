import React from 'react';

export interface Position {
  x: number;
  y: number;
}

export interface Viewport {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  center: Position;
}

export interface ZoomableSvgProps {
  height: number;
  width: number;
  initialViewport?: Viewport | null;
  viewBoxSizeX: number;
  viewBoxSizeY: number;
  content: React.ReactNode;
  onZoomChanged: (zoom: number) => void;
}

export interface ZoomableSvgRef {
  zoomToHotspot: (scale: number, x: number, y: number) => void;
}