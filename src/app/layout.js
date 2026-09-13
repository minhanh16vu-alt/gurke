import "./globals.css";

export const metadata = {
  title: "Gurke — grow your own apps",
  description:
    "Describe a small app in plain words. Gurke builds it, hosts it, and helps you put it on your home screen.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Gurke", statusBarStyle: "default" },
};

export const viewport = {
  themeColor: "#618751",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="bg-white text-ink font-body antialiased">
        {children}
        {/* Register Gurke's own service worker so Gurke itself is installable */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if ("serviceWorker" in navigator) {
              window.addEventListener("load", () =>
                navigator.serviceWorker.register("/sw.js").catch(() => {})
              );
            }`,
          }}
        />
      </body>
    </html>
  );
}
