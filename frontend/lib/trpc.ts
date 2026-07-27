import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import { type AppRouter as TRPCRouter } from '../../backend/src/trpc/router';

export type AppRouter = TRPCRouter;
export const trpc = createTRPCReact<AppRouter>();

export function getClientConfig() {
  return {
    links: [
      httpBatchLink({
        url: `${process.env.NEXT_PUBLIC_API_URL}/trpc`,
        async headers() {
          const session = await fetch('/api/auth/session').then((res) =>
            res.json()
          );
          return {
            Authorization: session?.user?.token
              ? `Bearer ${session.user.token}`
              : '',
          };
        },
      }),
    ],
  };
}