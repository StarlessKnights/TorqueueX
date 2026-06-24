"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, AlertCircle } from "lucide-react";

const gcodeFetchCache = new Map<string, Promise<string>>();
const gcodeCleanupMap = new WeakMap<HTMLElement, () => void>();

interface GcodeViewerProps {
  cadFilePath: string | null;
  partId: string;
}

interface Point {
  x: number;
  y: number;
}

interface PathSegment {
  points: Point[];
  isRapid: boolean;
  endPoint: Point;
}

interface ArcCenter {
  x: number;
  y: number;
  startPoint: Point;
  endPoint: Point;
}

interface RenderData {
  pathElements: Array<{
    path: SVGPathElement;
    points: Point[];
    isRapid: boolean;
  }>;
  totalPoints: number;
  pointsPerSecond: number;
  currentCircle: SVGCircleElement;
  endPointCircle: SVGCircleElement;
}

function pointsToPathData(points: Point[]): string {
  if (points.length === 0) return "";
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }
  return path;
}

function interpolateArc(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  centerOffsetI: number,
  centerOffsetJ: number,
  isClockwise: boolean,
): Point[] {
  const points: Point[] = [];

  const centerX = startX + centerOffsetI;
  const centerY = startY + centerOffsetJ;

  const startAngle = Math.atan2(startY - centerY, startX - centerX);
  const endAngle = Math.atan2(endY - centerY, endX - centerX);

  const radius = Math.hypot(centerOffsetI, centerOffsetJ);

  let angleDiff = endAngle - startAngle;

  if (isClockwise) {
    if (angleDiff > 0) {
      angleDiff -= 2 * Math.PI;
    }
  } else {
    if (angleDiff < 0) {
      angleDiff += 2 * Math.PI;
    }
  }

  const numSegments = Math.max(
    4,
    Math.ceil(Math.abs(angleDiff) / (Math.PI / 8)),
  );
  const angleStep = angleDiff / numSegments;

  for (let i = 0; i <= numSegments; i++) {
    const currentAngle = startAngle + angleStep * i;
    const x = centerX + radius * Math.cos(currentAngle);
    const y = centerY + radius * Math.sin(currentAngle);
    points.push({ x, y });
  }

  return points;
}

function parseGcode(gcodeText: string): {
  paths: PathSegment[];
  arcCenters: ArcCenter[];
} {
  const lines = gcodeText.split("\n");
  const paths: PathSegment[] = [];
  const arcCenters: ArcCenter[] = [];
  let currentPath: Point[] = [];
  let currentX = 0;
  let currentY = 0;
  let isMoving = false;
  let isRapid = false;
  let lastGCode = "";

  for (const line of lines) {
    const cleanLine = line
      .split(";")[0]
      .trim()
      .replace(/^N\d+\s*/, "");

    if (!cleanLine) continue;

    const tokens = cleanLine.split(/\s+/);

    let gCode = "";
    let tokenStartIndex = 0;

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].match(/^G\d+/)) {
        gCode = tokens[i];
        tokenStartIndex = i;
        break;
      }
    }

    if (!gCode) {
      gCode = lastGCode;
    }

    if (!gCode) continue;

    lastGCode = gCode;

    let newX = currentX;
    let newY = currentY;
    let centerOffsetI = 0;
    let centerOffsetJ = 0;

    for (let i = tokenStartIndex; i < tokens.length; i++) {
      const token = tokens[i];
      if (token[0] === "X") {
        newX = parseFloat(token.substring(1));
      } else if (token[0] === "Y") {
        newY = parseFloat(token.substring(1));
      } else if (token[0] === "I") {
        centerOffsetI = parseFloat(token.substring(1));
      } else if (token[0] === "J") {
        centerOffsetJ = parseFloat(token.substring(1));
      }
    }

    if (gCode === "G0" || gCode === "G00") {
      if (currentPath.length > 0) {
        paths.push({
          points: currentPath,
          isRapid,
          endPoint: { x: currentX, y: currentY },
        });
        currentPath = [];
      }
      isMoving = false;
      isRapid = true;
      if (newX !== currentX || newY !== currentY) {
        paths.push({
          points: [
            { x: currentX, y: currentY },
            { x: newX, y: newY },
          ],
          isRapid: true,
          endPoint: { x: newX, y: newY },
        });
      }
      currentX = newX;
      currentY = newY;
    } else if (gCode === "G1" || gCode === "G01") {
      if (!isMoving) {
        currentPath.push({ x: currentX, y: currentY });
        isMoving = true;
        isRapid = false;
      }
      currentPath.push({ x: newX, y: newY });
      currentX = newX;
      currentY = newY;
    } else if (gCode === "G2" || gCode === "G02") {
      if (!isMoving) {
        currentPath.push({ x: currentX, y: currentY });
        isMoving = true;
        isRapid = false;
      }
      const arcCenterX = currentX + centerOffsetI;
      const arcCenterY = currentY + centerOffsetJ;

      const arcPoints = interpolateArc(
        currentX,
        currentY,
        newX,
        newY,
        centerOffsetI,
        centerOffsetJ,
        true,
      );

      arcCenters.push({
        x: arcCenterX,
        y: arcCenterY,
        startPoint: { x: currentX, y: currentY },
        endPoint: { x: newX, y: newY },
      });

      for (let i = 1; i < arcPoints.length; i++) {
        currentPath.push(arcPoints[i]);
      }
      currentX = newX;
      currentY = newY;
    } else if (gCode === "G3" || gCode === "G03") {
      if (!isMoving) {
        currentPath.push({ x: currentX, y: currentY });
        isMoving = true;
        isRapid = false;
      }
      const arcCenterX = currentX + centerOffsetI;
      const arcCenterY = currentY + centerOffsetJ;

      const arcPoints = interpolateArc(
        currentX,
        currentY,
        newX,
        newY,
        centerOffsetI,
        centerOffsetJ,
        false,
      );

      arcCenters.push({
        x: arcCenterX,
        y: arcCenterY,
        startPoint: { x: currentX, y: currentY },
        endPoint: { x: newX, y: newY },
      });

      for (let i = 1; i < arcPoints.length; i++) {
        currentPath.push(arcPoints[i]);
      }
      currentX = newX;
      currentY = newY;
    }
  }

  if (currentPath.length > 0) {
    paths.push({
      points: currentPath,
      isRapid,
      endPoint: { x: currentX, y: currentY },
    });
  }

  return { paths, arcCenters };
}

export function GcodeViewer({ cadFilePath, partId }: GcodeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderDataRef = useRef<RenderData | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const animGenRef = useRef(0);

  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!cadFilePath || !containerRef.current) {
      return;
    }

    const container = containerRef.current;

    gcodeCleanupMap.get(container)?.();

    const loadAndRenderGcode = async () => {
      try {
        setProgress(10);
        setError(null);
        setIsPlaying(false);
        renderDataRef.current = null;
        animGenRef.current++;

        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }

        let textPromise = gcodeFetchCache.get(cadFilePath);
        if (!textPromise) {
          const fetchPromise = fetch(
            `/api/parts/download-cam?file=${encodeURIComponent(cadFilePath)}`,
          )
            .then((res) => {
              if (!res.ok) throw new Error("Failed to download CAM file");
              return res.blob();
            })
            .then((b) => b.text());

          fetchPromise.catch(() => {
            gcodeFetchCache.delete(cadFilePath);
          });

          gcodeFetchCache.set(cadFilePath, fetchPromise);
          textPromise = fetchPromise;
        }

        setProgress(40);

        const text = await textPromise;

        setProgress(60);

        const { paths, arcCenters } = parseGcode(text);

        if (paths.length === 0) {
          throw new Error("No valid G-code paths found in file");
        }

        setProgress(75);

        let minX = Infinity,
          maxX = -Infinity;
        let minY = Infinity,
          maxY = -Infinity;

        for (const segment of paths) {
          for (const point of segment.points) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
          }
        }

        for (const center of arcCenters) {
          minX = Math.min(minX, center.x);
          maxX = Math.max(maxX, center.x);
          minY = Math.min(minY, center.y);
          maxY = Math.max(maxY, center.y);
        }

        const parent = container.parentElement;
        if (!parent) {
          throw new Error("Container parent element not found");
        }

        const width = parent.clientWidth || 800;
        const height = parent.clientHeight || 600;

        const padding = 40;
        const availWidth = width - 2 * padding;
        const availHeight = height - 2 * padding;

        const rangeX = maxX - minX || 1;
        const rangeY = maxY - minY || 1;

        const scaleX = availWidth / rangeX;
        const scaleY = availHeight / rangeY;
        const scale = Math.min(scaleX, scaleY);

        const offsetX = padding + (availWidth - rangeX * scale) / 2;
        const offsetY = padding + (availHeight - rangeY * scale) / 2;

        const gridSpacing = 10;

        const svg = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg",
        );
        svg.setAttribute("width", String(width));
        svg.setAttribute("height", String(height));
        svg.setAttribute(
          "style",
          "display: block; border: 1px solid var(--border); border-radius: var(--radius); background: rgb(15, 23, 42);",
        );

        const bg = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect",
        );
        bg.setAttribute("width", String(width));
        bg.setAttribute("height", String(height));
        bg.setAttribute("fill", "#0b1226");
        svg.appendChild(bg);

        const gridGroup = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g",
        );
        gridGroup.setAttribute("stroke", "#334155");
        gridGroup.setAttribute("stroke-width", "0.5");

        for (let x = minX; x <= maxX; x += gridSpacing) {
          const px = offsetX + (x - minX) * scale;
          const line = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line",
          );
          line.setAttribute("x1", String(px));
          line.setAttribute("y1", String(padding));
          line.setAttribute("x2", String(px));
          line.setAttribute("y2", String(height - padding));
          gridGroup.appendChild(line);
        }

        for (let y = minY; y <= maxY; y += gridSpacing) {
          const py = offsetY + (y - minY) * scale;
          const line = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line",
          );
          line.setAttribute("x1", String(padding));
          line.setAttribute("y1", String(py));
          line.setAttribute("x2", String(width - padding));
          line.setAttribute("y2", String(py));
          gridGroup.appendChild(line);
        }

        svg.appendChild(gridGroup);

        const transformedPaths: Array<{
          points: Point[];
          isRapid: boolean;
          endPoint: Point;
        }> = paths.map((segment) => ({
          points: segment.points.map((p) => ({
            x: offsetX + (p.x - minX) * scale,
            y: offsetY + (p.y - minY) * scale,
          })),
          isRapid: segment.isRapid,
          endPoint: {
            x: offsetX + (segment.endPoint.x - minX) * scale,
            y: offsetY + (segment.endPoint.y - minY) * scale,
          },
        }));

        const transformedArcCenters: Array<{
          x: number;
          y: number;
          startPoint: Point;
          endPoint: Point;
        }> = arcCenters.map((c) => ({
          x: offsetX + (c.x - minX) * scale,
          y: offsetY + (c.y - minY) * scale,
          startPoint: {
            x: offsetX + (c.startPoint.x - minX) * scale,
            y: offsetY + (c.startPoint.y - minY) * scale,
          },
          endPoint: {
            x: offsetX + (c.endPoint.x - minX) * scale,
            y: offsetY + (c.endPoint.y - minY) * scale,
          },
        }));

        const totalPoints = transformedPaths.reduce(
          (sum, p) => sum + p.points.length,
          0,
        );
        const pointsPerSecond = totalPoints / 2.75;

        const pathElements: RenderData["pathElements"] = transformedPaths.map(
          (segment) => {
            const path = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path",
            );
            path.setAttribute(
              "stroke",
              segment.isRapid ? "#a78bfa" : "#60a5fa",
            );
            path.setAttribute(
              "stroke-width",
              String(segment.isRapid ? 0.8 : 2),
            );
            path.setAttribute("fill", "none");
            path.setAttribute("stroke-linecap", "round");
            path.setAttribute("stroke-linejoin", "round");
            path.setAttribute("d", pointsToPathData(segment.points));
            svg.appendChild(path);
            return {
              path,
              points: segment.points,
              isRapid: segment.isRapid,
            };
          },
        );

        const arcLinesGroup = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g",
        );
        arcLinesGroup.setAttribute("stroke", "#f97316");
        arcLinesGroup.setAttribute("stroke-width", "0.8");
        arcLinesGroup.setAttribute("fill", "none");

        for (const arcCenter of transformedArcCenters) {
          const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path",
          );
          path.setAttribute(
            "d",
            `M ${arcCenter.startPoint.x} ${arcCenter.startPoint.y} L ${arcCenter.x} ${arcCenter.y} L ${arcCenter.endPoint.x} ${arcCenter.endPoint.y}`,
          );
          arcLinesGroup.appendChild(path);
        }

        svg.appendChild(arcLinesGroup);

        const arcCirclesGroup = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g",
        );
        arcCirclesGroup.setAttribute("fill", "#f97316");

        for (const arcCenter of transformedArcCenters) {
          const circle = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle",
          );
          circle.setAttribute("cx", String(arcCenter.x));
          circle.setAttribute("cy", String(arcCenter.y));
          circle.setAttribute("r", "2.5");
          arcCirclesGroup.appendChild(circle);
        }

        svg.appendChild(arcCirclesGroup);

        const endCirclesGroup = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g",
        );
        endCirclesGroup.setAttribute("fill", "#f97316");

        for (const segment of transformedPaths) {
          const circle = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle",
          );
          circle.setAttribute("cx", String(segment.endPoint.x));
          circle.setAttribute("cy", String(segment.endPoint.y));
          circle.setAttribute("r", "2.5");
          endCirclesGroup.appendChild(circle);
        }

        svg.appendChild(endCirclesGroup);

        const startCirclesGroup = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g",
        );
        startCirclesGroup.setAttribute("fill", "#10b981");

        if (
          transformedPaths.length > 0 &&
          transformedPaths[0].points.length > 0
        ) {
          const sp = transformedPaths[0].points[0];
          const circle = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle",
          );
          circle.setAttribute("cx", String(sp.x));
          circle.setAttribute("cy", String(sp.y));
          circle.setAttribute("r", "5");
          startCirclesGroup.appendChild(circle);
        }

        svg.appendChild(startCirclesGroup);

        const currentCirclesGroup = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g",
        );
        currentCirclesGroup.setAttribute("fill", "#fbbf24");
        const currentCircle = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle",
        );
        currentCircle.setAttribute("r", "4");
        currentCircle.setAttribute("opacity", "0");
        currentCirclesGroup.appendChild(currentCircle);
        svg.appendChild(currentCirclesGroup);

        const endPointGroup = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g",
        );
        endPointGroup.setAttribute("fill", "#ef4444");
        const endPointCircle = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle",
        );
        endPointCircle.setAttribute("r", "5");
        endPointCircle.setAttribute("opacity", "0");
        endPointGroup.appendChild(endPointCircle);
        svg.appendChild(endPointGroup);

        container.innerHTML = "";
        container.appendChild(svg);

        renderDataRef.current = {
          pathElements,
          totalPoints,
          pointsPerSecond,
          currentCircle,
          endPointCircle,
        };

        setProgress(100);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error loading G-code";
        setError(errorMessage);
        console.error("Error loading G-code file:", err);
        setProgress(0);
      }
    };

    loadAndRenderGcode();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      gcodeCleanupMap.get(container)?.();
    };
  }, [cadFilePath, partId]);

  const handlePlay = useCallback(() => {
    const data = renderDataRef.current;
    if (!data) return;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    const gen = ++animGenRef.current;

    for (const { path } of data.pathElements) {
      path.setAttribute("d", "");
    }
    data.currentCircle.setAttribute("opacity", "0");
    data.endPointCircle.setAttribute("opacity", "0");

    setIsPlaying(true);

    const {
      pathElements,
      totalPoints,
      pointsPerSecond,
      currentCircle,
      endPointCircle,
    } = data;
    let startTime: number | null = null;

    const drawFrame = (timestamp: number) => {
      if (animGenRef.current !== gen) return;
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const pointsToDraw = Math.min(
        totalPoints,
        Math.floor((elapsed / 1000) * pointsPerSecond),
      );

      let remaining = pointsToDraw;
      let lastDrawnPoint: Point | null = null;

      for (const { path, points } of pathElements) {
        if (remaining <= 0) {
          path.setAttribute("d", "");
          break;
        }
        const count = Math.min(points.length, remaining);
        if (count === 0) {
          path.setAttribute("d", "");
          break;
        }

        const pointsToUse = points.slice(0, count);
        path.setAttribute("d", pointsToPathData(pointsToUse));

        if (count > 0) {
          lastDrawnPoint = pointsToUse[pointsToUse.length - 1];
        }

        remaining -= count;
      }

      if (pointsToDraw < totalPoints) {
        if (lastDrawnPoint) {
          currentCircle.setAttribute("cx", String(lastDrawnPoint.x));
          currentCircle.setAttribute("cy", String(lastDrawnPoint.y));
          currentCircle.setAttribute("opacity", "1");
          endPointCircle.setAttribute("opacity", "0");
        }
        animFrameRef.current = requestAnimationFrame(drawFrame);
      } else {
        const lastElement = pathElements[pathElements.length - 1];
        const ep = lastElement.points[lastElement.points.length - 1];
        endPointCircle.setAttribute("cx", String(ep.x));
        endPointCircle.setAttribute("cy", String(ep.y));
        endPointCircle.setAttribute("opacity", "1");
        currentCircle.setAttribute("opacity", "0");
        setIsPlaying(false);
      }
    };

    animFrameRef.current = requestAnimationFrame(drawFrame);
  }, []);

  if (!cadFilePath) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No CAM file uploaded
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-1 min-h-0">
        {progress < 100 && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted-foreground/20 z-50">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 border border-destructive rounded-md p-4 z-40">
            <div className="text-center">
              <p className="text-sm font-medium text-destructive">
                Failed to load G-code
              </p>
              <p className="text-xs text-muted-foreground mt-1 wrap-break-word">
                {error}
              </p>
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          className="w-full h-full"
          style={{ minHeight: "400px", display: "block" }}
        />

        {!error && progress >= 100 && (
          <button
            type="button"
            onClick={handlePlay}
            className="absolute bottom-4 right-4 z-40 flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-600 rounded-full px-4 py-2 transition-all duration-200 shadow-md"
          >
            <Play
              className={`h-4 w-4 text-blue-400 ${isPlaying ? "animate-pulse" : ""}`}
            />
            <span className="text-xs font-medium text-slate-200">
              {isPlaying ? "Replay" : "Play"}
            </span>
          </button>
        )}

        <div className="absolute bottom-4 left-4 z-40 group">
          <button
            className="flex items-center gap-2 bg-amber-900/40 hover:bg-amber-900/60 border border-amber-700 rounded-full px-3 py-2 transition-all duration-200"
            title="CAM preview warning"
          >
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-xs font-medium text-amber-100 hidden group-hover:inline whitespace-nowrap">
              Preview only
            </span>
          </button>

          <div className="absolute bottom-full left-0 mb-2 bg-amber-950/95 border border-amber-700 rounded-md p-3 w-max max-w-xs shadow-lg backdrop-blur-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
            <p className="text-xs font-medium text-amber-100">
              Preview for reference only
            </p>
            <p className="text-xs text-amber-100/70 mt-1">
              Always verify the toolpath in your CAM software before machining!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
