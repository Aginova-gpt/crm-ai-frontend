import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
}

export function useApi() {
  const router = useRouter();
  const { token, refreshToken, login, email } = useAuth();

  const fetchWithAuth = async (
    url: string,
    options: FetchOptions = {}
  ): Promise<Response> => {
    const { requiresAuth = true, headers = {}, ...restOptions } = options;

    let currentToken = token;
    if (!currentToken && requiresAuth) {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      if (storedToken) {
        currentToken = storedToken;
      }
    }

    const defaultHeaders: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (requiresAuth && currentToken) {
      (defaultHeaders as Record<string, string>)[
        "Authorization"
      ] = `Bearer ${currentToken}`;
    }

    const response = await fetch(url, {
      ...restOptions,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
    });

    // If unauthorized and we have a refresh token, try to refresh
    if (response.status === 401 && refreshToken) {
      try {
        const refreshResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/refresh`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${refreshToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (refreshResponse.ok) {
          const { access_token } = await refreshResponse.json();
          login(access_token, refreshToken, email ?? "");

          // Retry the original request with the new token
          return fetch(url, {
            ...restOptions,
            headers: {
              ...defaultHeaders,
              Authorization: `Bearer ${access_token}`,
              ...headers,
            },
          });
        } else {
          // If refresh fails, redirect to login
          router.push("/login");
          throw new Error("Session expired. Please login again.");
        }
      } catch (error) {
        router.push("/login");
        throw new Error("Session expired. Please login again.");
      }
    }

    return response;
  };

  return { fetchWithAuth };
}
