import { Suspense, lazy } from "react";
const loadSpline = () => import("@splinetool/react-spline");
const Spline = lazy(loadSpline);

export function preloadSplineScene() {
  return loadSpline();
}

export function SplineScene({ scene, className, onLoad }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center rounded-[2rem] bg-gradient-to-br from-primary/10 via-background/40 to-primary/5">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="loader"></span>
            <p className="text-sm text-muted-foreground">
              Loading assistant...
            </p>
          </div>
        </div>
      }
    >
      <Spline scene={scene} className={className} onLoad={onLoad} />
    </Suspense>
  );
}
