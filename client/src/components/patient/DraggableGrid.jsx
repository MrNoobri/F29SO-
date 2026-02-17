import React, { useMemo, useState } from "react";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const STORAGE_KEY = "vhc-patient-layout";

function loadLayout() {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export default function DraggableGrid({ children, rowHeight = 176, cols = 12 }) {
  const defaultLayout = useMemo(
    () =>
      React.Children.toArray(children).map((child, index) => ({
        i: String(child.key ?? index),
        x: (index % 2) * 6,
        y: Math.floor(index / 2),
        w: 6,
        h: 1,
      })),
    [children],
  );

  const [layout, setLayout] = useState(() => loadLayout() || defaultLayout);

  const handleLayoutChange = (nextLayout) => {
    setLayout(nextLayout);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextLayout));
    }
  };

  return (
    <GridLayout
      className="layout"
      layout={layout}
      cols={cols}
      rowHeight={rowHeight}
      width={1120}
      margin={[16, 16]}
      onLayoutChange={handleLayoutChange}
      draggableHandle=".drag-handle"
    >
      {React.Children.map(children, (child) => (
        <div key={child.key} className="rounded-[1.75rem]">
          {child}
        </div>
      ))}
    </GridLayout>
  );
}
