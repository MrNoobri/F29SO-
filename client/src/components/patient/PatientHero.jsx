import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { SplineScene, preloadSplineScene } from "@/components/ui/splite";
import { Spotlight } from "@/components/ui/spotlight";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { cn } from "@/lib/utils";

export default function PatientHero({ userName, heroRef }) {
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.6, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  // ── Mouse tracking for Spline 3D follow ──
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isSceneReady, setIsSceneReady] = useState(false);
  const heroContainer = useRef(null);

  useEffect(() => {
    preloadSplineScene().catch(() => {});
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!heroContainer.current) return;
    const rect = heroContainer.current.getBoundingClientRect();
    // Normalize to -1..1 from center
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePos({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: 0, y: 0 });
  }, []);

  // Transform mouse position into subtle 3D movement
  const splineTranslateX = mousePos.x * 30; // ±30px
  const splineTranslateY = mousePos.y * 20; // ±20px
  const splineRotateY = mousePos.x * 8; // ±8deg
  const splineRotateX = -mousePos.y * 5; // ±5deg

  return (
    <motion.div
      ref={heroContainer}
      className="relative h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Spotlight effect */}
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="hsl(var(--primary))"
      />

      {/* Animated path lines behind the robot */}
      <BackgroundPaths className="opacity-40" />

      {/* Gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-60 bg-[var(--bg-effect-1)]" />
        <div className="absolute bottom-1/3 right-1/4 w-[22rem] h-[22rem] rounded-full blur-3xl opacity-50 bg-[var(--bg-effect-2)]" />
        <div className="absolute top-2/3 left-1/2 w-[18rem] h-[18rem] rounded-full blur-3xl opacity-40 bg-[var(--bg-effect-3)]" />
      </div>

      {/* MEDXI + Welcome — fades out as flying XI takes over */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        style={{ opacity: textOpacity }}
      >
        <motion.h1
          className="text-[clamp(3rem,10vw,7rem)] font-black tracking-tighter leading-none select-none"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="text-primary">MED</span>
          <span className="text-foreground">XI</span>
        </motion.h1>
        <motion.p
          className="text-lg md:text-xl text-foreground/60 mt-3 font-medium tracking-wide"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Welcome back, {userName}
        </motion.p>
        <motion.p
          className="text-sm text-muted-foreground mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Your health dashboard is ready
        </motion.p>
      </motion.div>

      {/* Spline 3D scene — follows cursor position */}
      <div
        className="absolute right-[-5%] top-0 hidden h-full w-[65%] lg:block"
        style={{
          transform: `translate3d(${splineTranslateX}px, ${splineTranslateY}px, 0) rotateY(${splineRotateY}deg) rotateX(${splineRotateX}deg)`,
          transition: "transform 0.15s ease-out",
          perspective: "1000px",
        }}
      >
        <div className="relative h-full w-full">
          <motion.div
            className={cn(
              "absolute inset-0 rounded-[2rem] border border-border/40 bg-gradient-to-br from-primary/10 via-background/40 to-primary/5 backdrop-blur-sm",
              isSceneReady && "pointer-events-none",
            )}
            initial={false}
            animate={{
              opacity: isSceneReady ? 0 : 1,
              scale: isSceneReady ? 0.98 : 1,
            }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-14 w-14 rounded-full border border-primary/20 bg-primary/10" />
                <p className="text-sm text-muted-foreground">
                  Preparing MEDXI assistant...
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="h-full w-full opacity-80"
            initial={false}
            animate={{
              opacity: isSceneReady ? 1 : 0,
              y: isSceneReady ? 0 : 16,
              filter: isSceneReady ? "blur(0px)" : "blur(10px)",
            }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
              onLoad={() => setIsSceneReady(true)}
            />
          </motion.div>
        </div>
      </div>

      {/* Scroll-down indicator */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
          Scroll down
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 rounded-full border-2 border-muted-foreground/40 flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-1.5 rounded-full bg-muted-foreground/60" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
