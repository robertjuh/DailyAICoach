import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/db/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AuthResult {
  userId: string;
  supabaseUser: SupabaseUser;
}

export class AuthError extends Error {
  status: number;
  code: string;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  // Try Authorization header first
  const authHeader = request.headers.get("Authorization");
  let token: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  // Create a Supabase client for the API route
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // API routes don't need to set cookies
        },
      },
    }
  );

  // If we have a bearer token, use it; otherwise rely on cookies
  const {
    data: { user: supabaseUser },
    error,
  } = token
    ? await supabase.auth.getUser(token)
    : await supabase.auth.getUser();

  if (error || !supabaseUser) {
    throw new AuthError("Unauthorized", "AUTH_REQUIRED", 401);
  }

  // Find the corresponding user in our database
  const dbUser = await prisma.user.findUnique({
    where: { supabase_id: supabaseUser.id },
  });

  if (!dbUser) {
    throw new AuthError("User not found", "USER_NOT_FOUND", 404);
  }

  return {
    userId: dbUser.id,
    supabaseUser,
  };
}

/**
 * Lighter auth check that only validates the Supabase JWT.
 * Use for routes where the DB user may not exist yet (e.g. onboarding).
 */
export async function requireSupabaseAuth(
  request: NextRequest
): Promise<{ supabaseUser: SupabaseUser }> {
  const authHeader = request.headers.get("Authorization");
  let token: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user: supabaseUser },
    error,
  } = token
    ? await supabase.auth.getUser(token)
    : await supabase.auth.getUser();

  if (error || !supabaseUser) {
    throw new AuthError("Unauthorized", "AUTH_REQUIRED", 401);
  }

  return { supabaseUser };
}
