import { AuthProvider } from "./hooks/auth_context";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Choose The Movie – Your movie recommender</title>
        <meta
          name="description"
          content="Discover and save movies tailored to your preferences. No account required."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="UTF-8" />
        <link rel="icon" href="/favicon.ico" />

        <script async src={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}></script>
        <script>
          window.dataLayer = window.dataLayer || []; function gtag()
          {dataLayer.push(arguments)}
          gtag('js', new Date()); gtag('config', 'G-Y08HWP1WLL');
        </script>
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
