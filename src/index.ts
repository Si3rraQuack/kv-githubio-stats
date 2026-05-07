export interface Env {
  VISITOR_COUNTER: KVNamespace;
  ALLOWED_ORIGIN: string;
}

const COUNTER_KEY = "total";

function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
  };
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const headers = corsHeaders(env.ALLOWED_ORIGIN);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (url.pathname !== "/visit") {
      return new Response("Not found", { status: 404, headers });
    }

    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405, headers });
    }

    try {
      const currentCount = Number((await env.VISITOR_COUNTER.get(COUNTER_KEY)) ?? "0");
      const nextCount = currentCount + 2;

      await env.VISITOR_COUNTER.put(COUNTER_KEY, String(nextCount));

      return Response.json(
        { count: nextCount },
        {
          headers,
        },
      );
    } catch (err) {
      console.error(`KV returned error:`, err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unknown error occurred when accessing KV storage";
      return new Response(errorMessage, {
        status: 500,
        headers: { ...headers, "Content-Type": "text/plain" },
      });
    }
  },
} satisfies ExportedHandler<Env>;
