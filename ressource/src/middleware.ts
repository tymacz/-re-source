import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const sessionResponse = await fetch(new URL("/api/auth/get-session", request.url), {
    headers: {
      cookie: request.headers.get("cookie") || "",
    },
  });

  const session = sessionResponse.ok ? await sessionResponse.json() : null;

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/ressources/creer")) {
    if (!session || !session.user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!session || !session.user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    
    if (session.user.role_id !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};