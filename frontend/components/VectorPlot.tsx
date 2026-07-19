"use client";

import createPlotlyComponent from "react-plotly.js/factory";
import Plotly from "plotly.js-gl3d-dist-min";

const Plot = createPlotlyComponent(Plotly);

export type Point3 = [number, number, number];

export default function VectorPlot({
  user,
  matches,
}: {
  user: Point3;
  matches: { coords: Point3; price: number; similarity: number }[];
}) {
  const dark =
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  // Dataviz skill's validated categorical slots 1-4 (blue/green/magenta/yellow) -
  // this is the exact case its docs call out (4-series, all-pairs scatter
  // comparison) as the one where the first 4 slots clear the all-pairs CVD
  // floor in both modes (dark lands in the 6-8 band, hence the legend below
  // as required secondary encoding, not decoration).
  const colors = dark
    ? ["#3987e5", "#008300", "#d55181", "#c98500"]
    : ["#2a78d6", "#008300", "#e87ba4", "#eda100"];
  const ink = dark ? "#c3c2b7" : "#52514e"; // secondary ink, for legend text
  // Primary-ink tint (not the gridline token, which is already near-white/
  // near-black and invisible as a fill against its own surface) at three
  // graduated opacities, so the plot's three "room corner" wall planes stay
  // visually distinct - this is what actually reads as 3D depth, versus a
  // hidden-axes plot which looks flat regardless of camera angle.
  const inkRGB = dark ? "255,255,255" : "11,11,11";
  const wallOpacity = [0.07, 0.045, 0.025];
  // WebGL canvases don't correctly alpha-composite "transparent" against the
  // page behind them (the plane fills above blend against the canvas's own
  // opaque clear color first) - so the scene/paper background must be set to
  // the app's actual --color-surface value, not left transparent, or it
  // renders as a stray opaque-white box in dark mode.
  const surface = dark ? "#171717" : "#ffffff";

  const traces = [
    {
      type: "scatter3d" as const,
      mode: "lines+markers" as const,
      x: [0, user[0]],
      y: [0, user[1]],
      z: [0, user[2]],
      line: { color: colors[0], width: 4 },
      marker: { size: 5, color: colors[0] },
      name: "Your listing",
    },
    ...matches.map((m, i) => ({
      type: "scatter3d" as const,
      mode: "lines+markers" as const,
      x: [0, m.coords[0]],
      y: [0, m.coords[1]],
      z: [0, m.coords[2]],
      line: { color: colors[i + 1], width: 4 },
      marker: { size: 5, color: colors[i + 1] },
      name: `$${m.price}/night · ${(m.similarity * 100).toFixed(0)}% match`,
    })),
  ];

  const wallAxis = (opacity: number) => ({
    showbackground: true,
    backgroundcolor: `rgba(${inkRGB},${opacity})`,
    showgrid: true,
    gridcolor: `rgba(${inkRGB},0.22)`,
    showticklabels: false,
    zeroline: false,
    title: { text: "" },
  });

  return (
    <Plot
      data={traces}
      layout={{
        autosize: true,
        margin: { l: 0, r: 0, t: 0, b: 0 },
        paper_bgcolor: surface,
        scene: {
          bgcolor: surface,
          aspectmode: "cube",
          camera: { eye: { x: 1.6, y: 1.6, z: 1.1 } },
          xaxis: wallAxis(wallOpacity[0]),
          yaxis: wallAxis(wallOpacity[1]),
          zaxis: wallAxis(wallOpacity[2]),
        },
        legend: { font: { size: 10, color: ink } },
        showlegend: true,
      }}
      style={{ width: "100%", height: "260px" }}
      useResizeHandler
      config={{ displayModeBar: false }}
    />
  );
}
