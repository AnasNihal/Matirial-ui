import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs"

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-screen flex justify-center items-center">
      <SignedOut>{children}</SignedOut>
      <SignedIn>
        <RedirectToSignIn />
      </SignedIn>
    </div>
  )
}

export default Layout
