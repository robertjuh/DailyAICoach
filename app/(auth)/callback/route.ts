import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    // Default redirect — will be updated based on onboarding status
    let redirectUrl = `${origin}/onboarding`;

    // We need to set cookies on the final response, so collect them first
    const cookieStore: { name: string; value: string; options: Record<string, unknown> }[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach((cookie) => cookieStore.push(cookie));
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { supabase_id: user.id },
        });

        if (dbUser?.onboarding_done) {
          redirectUrl = `${origin}/`;
        }
      }

      // Create response with correct redirect and apply ALL cookies
      const response = NextResponse.redirect(redirectUrl);
      cookieStore.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options)
      );
      return response;
    }
  }

  // Return to login on error
  return NextResponse.redirect(`${origin}/login`);
}
