"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";

const gcodeFetchCache = new Map<string, Promise<string>>();

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const skipAnimationRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cadFilePath || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;

    try {
      const prevCleanup = (canvas as any).__gcodeCleanup;
      if (typeof prevCleanup === "function") prevCleanup();
    } catch (e) {}

    const loadAndRenderGcode = async () => {
      try {
        setIsLoading(true);
        setError(null);

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

        const text = await textPromise;

        const { paths, arcCenters } = parseGcode(text);

        if (paths.length === 0) {
          throw new Error("No valid G-code paths found in file");
        }

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

        const parent = canvas.parentElement;
        if (!parent) {
          throw new Error("Canvas parent element not found");
        }

        const width = parent.clientWidth || 800;
        const height = parent.clientHeight || 600;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Failed to get canvas context");
        }

        ctx.fillStyle = "#0b1226";
        ctx.fillRect(0, 0, width, height);

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

        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 0.5;
        const gridSpacing = 10;

        const drawGrid = () => {
          for (let x = minX; x <= maxX; x += gridSpacing) {
            const px = offsetX + (x - minX) * scale;
            ctx.beginPath();
            ctx.moveTo(px, padding);
            ctx.lineTo(px, height - padding);
            ctx.stroke();
          }
          for (let y = minY; y <= maxY; y += gridSpacing) {
            const py = offsetY + (y - minY) * scale;
            ctx.beginPath();
            ctx.moveTo(padding, py);
            ctx.lineTo(width - padding, py);
            ctx.stroke();
          }
        };

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
        const pointsPerSecond = 600;

        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        let startTime: number | null = null;
        let rafId: number | null = null;
        let cancelled = false;

        const drawFrame = (timestamp: number) => {
          if (cancelled) return;
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const pointsToDraw = skipAnimationRef.current
            ? totalPoints
            : Math.min(
                totalPoints,
                Math.floor((elapsed / 1000) * pointsPerSecond),
              );

          ctx.fillStyle = "#0b1226";
          ctx.fillRect(0, 0, width, height);
          ctx.strokeStyle = "#334155";
          drawGrid();

          let remaining = pointsToDraw;
          let lastDrawnPoint: Point | null = null;

          for (const segment of transformedPaths) {
            if (remaining <= 0) break;
            const count = Math.min(segment.points.length, remaining);
            if (count === 0) break;

            ctx.strokeStyle = segment.isRapid ? "#a78bfa" : "#60a5fa";
            ctx.lineWidth = segment.isRapid ? 0.8 : 2;

            ctx.beginPath();
            ctx.moveTo(segment.points[0].x, segment.points[0].y);
            for (let i = 1; i < count; i++) {
              ctx.lineTo(segment.points[i].x, segment.points[i].y);
              lastDrawnPoint = segment.points[i];
            }
            ctx.stroke();

            remaining -= count;
          }

          for (const arcCenter of transformedArcCenters) {
            ctx.strokeStyle = "#f97316";
            ctx.lineWidth = 0.8;

            ctx.beginPath();
            ctx.moveTo(arcCenter.startPoint.x, arcCenter.startPoint.y);
            ctx.lineTo(arcCenter.x, arcCenter.y);
            ctx.lineTo(arcCenter.endPoint.x, arcCenter.endPoint.y);
            ctx.stroke();
          }

          for (const arcCenter of transformedArcCenters) {
            ctx.fillStyle = "#f97316";
            ctx.beginPath();
            ctx.arc(arcCenter.x, arcCenter.y, 2.5, 0, 2 * Math.PI);
            ctx.fill();
          }

          for (const segment of transformedPaths) {
            ctx.fillStyle = "#f97316";
            ctx.beginPath();
            ctx.arc(
              segment.endPoint.x,
              segment.endPoint.y,
              2.5,
              0,
              2 * Math.PI,
            );
            ctx.fill();
          }

          if (
            transformedPaths.length > 0 &&
            transformedPaths[0].points.length > 0
          ) {
            const sp = transformedPaths[0].points[0];
            ctx.fillStyle = "#10b981";
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, 5, 0, 2 * Math.PI);
            ctx.fill();
          }

          if (pointsToDraw < totalPoints) {
            if (lastDrawnPoint) {
              ctx.fillStyle = "#fbbf24";
              ctx.beginPath();
              ctx.arc(lastDrawnPoint.x, lastDrawnPoint.y, 4, 0, 2 * Math.PI);
              ctx.fill();
            }
          } else {
            const lastPath = transformedPaths[transformedPaths.length - 1];
            const ep = lastPath.points[lastPath.points.length - 1];
            ctx.fillStyle = "#ef4444";
            ctx.beginPath();
            ctx.arc(ep.x, ep.y, 5, 0, 2 * Math.PI);
            ctx.fill();
            setIsLoading(false);
          }

          if (pointsToDraw < totalPoints) {
            rafId = requestAnimationFrame(drawFrame);
          }
        };

        rafId = requestAnimationFrame(drawFrame);

        const cleanup = () => {
          cancelled = true;
          if (rafId) cancelAnimationFrame(rafId);
        };

        (canvas as any).__gcodeCleanup = cleanup;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error loading G-code";
        setError(errorMessage);
        console.error("Error loading G-code file:", err);
        setIsLoading(false);
      }
    };

    loadAndRenderGcode();

    return () => {
      try {
        const c = (canvas as any).__gcodeCleanup;
        if (typeof c === "function") c();
      } catch (e) {}
    };
  }, [cadFilePath, partId]);

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
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm text-muted-foreground">
                Loading CAM file...
              </p>
              <p className="text-xs text-muted-foreground mt-1 wrap-break-word">
                This may take a few seconds for large files
              </p>
              <button
                type="button"
                onClick={() => {
                  skipAnimationRef.current = true;
                }}
                className="text-xs text-muted-foreground/40 hover:text-muted-foreground/70 underline underline-offset-2 mt-3 transition-colors"
              >
                Skip animation
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 border border-destructive rounded-md p-4">
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

        <canvas
          ref={canvasRef}
          className="w-full h-full border border-border rounded-md bg-slate-900"
          style={{ minHeight: "400px", display: "block" }}
        />

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
