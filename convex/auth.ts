import GitHub from "@auth/core/providers/github";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [GitHub],
  callbacks: {
    async redirect({ redirectTo }) {
      // This is needed to make it work for both web and mobile.
      // Without this, you need to use "bunx convex env set SITE_URL http://localhost:8081" for web or "bunx convex env set SITE_URL muscletrophy://" to make it work on mobile.
      // With this, you can just set the SITE_URL to http://localhost:8081 and it will work for both web and mobile.
      if (
        redirectTo !== "muscletrophy://" &&
        redirectTo !== "http://localhost:8081"
      ) {
        throw new Error(`Invalid redirectTo URI ${redirectTo}`);
      }
      return redirectTo;
    },
  },
});
