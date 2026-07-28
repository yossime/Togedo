import 'next-auth';

declare module 'next-auth' {
  /**
   * Returned by the backend login endpoint and stored on the NextAuth user
   * by the credentials provider.
   */
  interface User {
    access_token?: string;
  }

  /**
   * Shape of the session available via useSession()/getSession().
   * `accessToken` is the backend-issued JWT used for tRPC and Socket.IO auth.
   */
  interface Session {
    accessToken?: string;
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
