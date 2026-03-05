import Link from "next/link";
import LiveUpdates from "./LiveUpdates";

export type PitStatus = "TODO" | "IN_PROGRESS" | "DONE";

type PitUpdate = {
    id: string;
    buildId: string;
    message: string;
    severity: string;
    createdAt: string;
    status: PitStatus;
};

type BuildWithUpdates = {
    id: string;
    name: string;
    createdAt: string;
    updates: PitUpdate[];
};

async function getBuild(id: string): Promise<BuildWithUpdates> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }

  const res = await fetch(`${baseUrl}/api/builds/${id}`, {
    cache: "no-store",
  });

  if (res.status === 404) {
    throw new Error("Build not found"); // later we can make this a real Next 404 page
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch build: ${res.status}`);
  }

  return res.json();
}


export default async function BuildPage({params,}: { params: Promise<{ id: string }>; }) {
    const { id } = await params;       // ✅ unwrap params FIRST
    const build = await getBuild(id);  // ✅ now id is real

    return(

        <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
            <Link href="/builds" style={{ display: "inline-block", marginBottom: 16 }}>
                ← Back
            </Link>

            <h1 style={{ fontSize: 40, margin: 0 }}>{build.name}</h1>
            <p style={{ opacity: 0.7, marginTop: 8}}>{build.id}</p>

            <h2 style={{ marginTop: 32 }}>Pit Updates</h2>
            <LiveUpdates buildId={build.id} initialUpdates={build.updates} />

        </main>
    );

}