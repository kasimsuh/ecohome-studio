import localFont from "next/font/local";

export const silkscreen = localFont({
  src: [
    {
      path: "./fonts/silkscreen/Silkscreen-Regular.ttf",
      weight: "400",
      style: "normal"
    },
    {
      path: "./fonts/silkscreen/Silkscreen-Bold.ttf",
      weight: "700",
      style: "normal"
    }
  ],
  display: "swap",
  variable: "--font-tech"
});
