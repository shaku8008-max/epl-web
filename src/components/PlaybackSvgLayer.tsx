"use client";

import { useEffect, useRef } from "react";
import type { PlaybackTimeline } from "@/components/PlaybackTimeline";

export type PlaybackLine = {
  modelKey: string;
  points: { position: number; value: number }[];
  colour: string;
  firstPosition?: number;
};

type PlaybackSvgLayerProps = {
  timeline: PlaybackTimeline;
  clipId: string;
  left: number;
  top: number;
  plotWidth: number;
  plotHeight: number;
  maxPosition: number;
  lines: PlaybackLine[];
  xAtPosition: (position: number) => number;
  y: (value: number) => number;
};

function interpolate(points: PlaybackLine["points"], position: number) {
  if (points.length === 0) return null;
  if (position <= points[0].position) return points[0];
  const last = points[points.length - 1];
  if (position >= last.position) return last;
  for (let index = 1; index < points.length; index += 1) {
    const next = points[index];
    const previous = points[index - 1];
    if (position <= next.position) {
      const span = next.position - previous.position || 1;
      const amount = (position - previous.position) / span;
      return {
        position,
        value: previous.value + (next.value - previous.value) * amount,
      };
    }
  }
  return last;
}

export default function PlaybackSvgLayer({
  timeline,
  clipId,
  left,
  top,
  plotWidth,
  plotHeight,
  maxPosition,
  lines,
  xAtPosition,
  y,
}: PlaybackSvgLayerProps) {
  const clipRef = useRef<SVGRectElement>(null);
  const markerRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const update = () => {
      const position = timeline.getPosition();
      const progress = maxPosition === 0 ? 1 : position / maxPosition;
      clipRef.current?.setAttribute("width", String(Math.max(0, Math.min(plotWidth, progress * plotWidth))));
      lines.forEach((line) => {
        const point = interpolate(line.points, position);
        const marker = markerRef.current?.querySelector<SVGCircleElement>(`[data-model="${line.modelKey}"]`);
        if (!point || !marker) return;
        marker.setAttribute("cx", String(xAtPosition(point.position)));
        marker.setAttribute("cy", String(y(point.value)));
        marker.setAttribute("opacity", position < (line.firstPosition ?? line.points[0].position) ? "0" : "1");
      });
    };
    update();
    return timeline.subscribe(update);
  }, [lines, maxPosition, plotWidth, timeline, xAtPosition, y]);

  return (
    <>
      <clipPath id={clipId}>
        <rect ref={clipRef} x={left} y={top} width={plotWidth} height={plotHeight} />
      </clipPath>
      <g ref={markerRef} aria-hidden="true">
        {lines.map((line) => (
          <circle key={line.modelKey} data-model={line.modelKey} r={5} fill="white" stroke={line.colour} strokeWidth={2} />
        ))}
      </g>
    </>
  );
}
