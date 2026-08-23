import { getStore } from "@netlify/blobs";

export default async () => {
  try {
    const store = getStore("ojnice-site-content");

    // Lecture uniquement : aucune donnée n'est créée ou modifiée.
    await store.get("healthcheck");

    return Response.json(
      {
        ok: true,
        service: "ojnice-site",
        functions: true,
        blobs: true
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    console.error("OJN site healthcheck failed", error);

    return Response.json(
      {
        ok: false,
        service: "ojnice-site"
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }
};

export const config = {
  path: "/api/health",
  method: "GET"
};
