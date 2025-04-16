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
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
