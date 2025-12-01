
import { Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "sonner";
import ReactQueryProvider from "@/providers/react-query-provider";
import ReduxProvider from "@/providers/redux-provider";
import ErrorLogger from "@/components/global/error-logger";
import type { Metadata } from "next";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mation",
  description: "Automate DMs and comments on Instagram",
};


export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      appearance={{
        layout: {
          // 🚀 FAST: Minimize layout shifts
          shimmer: false,
        },
        variables: {
          // 🚀 FAST: Reduce animations
          borderRadius: '0.5rem',
        },
      }}
      // 🚀 FAST: Load Clerk resources faster
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      // 🚀 FAST: Use faster domain if available
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/callback/sign-in"
      afterSignUpUrl="/callback/sign-in"
    >
      <html lang="en">
        <body suppressHydrationWarning className={jakarta.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            disableTransitionOnChange
          >
            <ErrorLogger />
            <ReduxProvider>
              <ReactQueryProvider>{children}</ReactQueryProvider>
            </ReduxProvider>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
