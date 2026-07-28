import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { type AppRouter as TRPCRouter } from '../../backend/src/trpc/router';

export type AppRouter = TRPCRouter;
export const trpc = createTRPCReact<AppRouter>();

export function getClientConfig() {
  return {
    transformer: superjson,
    links: [
      httpBatchLink({
        url: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/trpc`,
        async headers() {
          try {
            const res = await fetch('/api/auth/session');
            if (!res.ok) return {};

            const session = await res.json();
            return session?.accessToken
              ? { Authorization: `Bearer ${session.accessToken}` }
              : {};
          } catch {
            return {};
          }
        },
      }),
    ],
  };
}
