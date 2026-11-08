"use client";

import { useEffect, useRef } from "react";
import type { PlaybackTimeline } from "@/components/PlaybackTimeline";

export type PlaybackLine = {
  modelKey: string;
  points: { timestamp: number; value: number }[];
  colour: string;
};

type PlaybackSvgLayerProps = {
  timeline: PlaybackTimeline;
  clipId: string;
  left: number;
  top: number;
  plotWidth: number;
  plotHeight: number;
  minTime: number;
  maxTime: number;
  lines: PlaybackLine[];
  xAtTime: (timestamp: number) => number;
  y: (value: number) => number;
};

function interpolate(points: PlaybackLine["points"], timestamp: number) {
  if (points.length === 0) return null;
  if (timestamp <= points[0].timestamp) return points[0];
  const last = points[points.length - 1];
  if (timestamp >= last.timestamp) return last;
  for (let index = 1; index < points.length; index += 1) {
    const next = points[index];
    const previous = points[index - 1];
    if (timestamp <= next.timestamp) {
      const span = next.timestamp - previous.timestamp || 1;
      const amount = (timestamp - previous.timestamp) / span;
      return {
        timestamp,
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
  minTime,
  maxTime,
  lines,
  xAtTime,
  y,
}: PlaybackSvgLayerProps) {
  const clipRef = useRef<SVGRectElement>(null);
  const markerRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const update = () => {
      const timestamp = timeline.getDateTimestamp();
      const progress = maxTime === minTime ? 1 : (timestamp - minTime) / (maxTime - minTime);
      clipRef.current?.setAttribute("width", String(Math.max(0, Math.min(plotWidth, progress * plotWidth))));
      lines.forEach((line) => {
        const point = interpolate(line.points, timestamp);
        const marker = markerRef.current?.querySelector<SVGCircleElement>(`[data-model="${line.modelKey}"]`);
        if (!point || !marker) return;
        marker.setAttribute("cx", String(xAtTime(point.timestamp)));
        marker.setAttribute("cy", String(y(point.value)));
        marker.setAttribute("opacity", timestamp < line.points[0].timestamp ? "0" : "1");
      });
    };
    update();
    return timeline.subscribe(update);
  }, [lines, maxTime, minTime, plotWidth, timeline, xAtTime, y]);

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
