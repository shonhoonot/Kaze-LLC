"use client";

import { useEffect, useRef, useState } from "react";
import { Api } from "@/lib/api";
import type { User } from "@/lib/types";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const GSI_SRC = "https://accounts.google.com/gsi/client";

interface GoogleCredentialResponse {
  credential: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (r: GoogleCredentialResponse) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
}: {
  onSuccess: (token: string, user: User) => void;
  onError?: (message: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  // Feature is unconfigured until a client id is supplied — show a placeholder.
  useEffect(() => {
    if (!CLIENT_ID) return;
    if (document.querySelector(`script[src="${GSI_SRC}"]`)) {
      setLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!loaded || !CLIENT_ID || !ref.current || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: async (resp) => {
        try {
          const res = await Api.googleLogin(resp.credential);
          onSuccess(res.access_token, res.user);
        } catch (e) {
          onError?.(e instanceof Error && e.message ? e.message : "Google нэвтрэлт амжилтгүй боллоо.");
        }
      },
    });
    window.google.accounts.id.renderButton(ref.current, {
      theme: "outline",
      size: "large",
      width: 320,
      text: "continue_with",
      locale: "mn",
    });
  }, [loaded, onSuccess, onError]);

  if (!CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        className="btn-outline flex w-full items-center justify-center gap-2 opacity-60"
        title="Google нэвтрэлт удахгүй тохируулагдана"
      >
        <span className="text-lg">G</span> Google-ээр нэвтрэх (тун удахгүй)
      </button>
    );
  }

  return <div ref={ref} className="flex justify-center" />;
}
