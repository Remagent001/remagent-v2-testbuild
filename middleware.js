export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/jobs/:path*",
    "/my-jobs/:path*",
    "/inbox/:path*",
    "/settings/:path*",
    "/positions/:path*",
    "/search/:path*",
    "/applications/:path*",
    "/offers/:path*",
    "/company-profile/:path*",
    "/invites/:path*",
    "/applicants/:path*",
    "/hires/:path*",
    "/onboarding/:path*",
    "/admin/:path*",
  ],
};
