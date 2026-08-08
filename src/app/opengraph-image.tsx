import { ImageResponse } from "next/og";

export const alt = "@larsen-utvikling/create-next-app - a Next.js starter with a real design system";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BRAND_BLUE = "#4DA0FF";
const BACKGROUND = "#0a0a0a";
const FOREGROUND = "#fafafa";
const SUBTLE = "#a3a3a3";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: BACKGROUND,
          color: FOREGROUND,
          padding: 88,
          position: "relative",
        }}
      >
        {/* Brand corner brackets, the same motif the main site uses */}
        <div
          style={{
            position: "absolute",
            top: 48,
            right: 48,
            width: 120,
            height: 120,
            borderTop: `4px solid ${BRAND_BLUE}`,
            borderRight: `4px solid ${BRAND_BLUE}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 48,
            left: 48,
            width: 120,
            height: 120,
            borderBottom: `4px solid ${BRAND_BLUE}`,
            borderLeft: `4px solid ${BRAND_BLUE}`,
          }}
        />

        <div
          style={{
            fontSize: 24,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: BRAND_BLUE,
            marginBottom: 24,
          }}
        >
          npx @larsen-utvikling/create-next-app
        </div>

        <div
          style={{
            fontSize: 76,
            fontWeight: 700,
            letterSpacing: -2,
            lineHeight: 1.05,
            maxWidth: 900,
          }}
        >
          A Next.js starter with a real design system
        </div>

        <div style={{ fontSize: 28, color: SUBTLE, marginTop: 32, maxWidth: 860 }}>
          Colour from one HEX · motion tokens · agent docs · no Tailwind
        </div>
      </div>
    ),
    size,
  );
}
