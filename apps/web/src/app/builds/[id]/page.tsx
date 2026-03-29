import Link from "next/link";
import LiveUpdates from "./LiveUpdates";
import Navbar from "../../components/Navbar";

export type PitStatus = "TODO" | "IN_PROGRESS" | "DONE";

type PitUpdate = {
    id: string;
    buildId: string;
    message: string;
    severity: string;
    createdAt: string;
    status: PitStatus;
    archivedAt: string | null;
};

type BuildWithUpdates = {
    id: string;
    name: string;
    make: string;
    model: string;
    createdAt: string;
    updates: PitUpdate[];
};

type Build = {
  id: string;
  name: string;
  make: string;
  model: string;
  createdAt: string;
  updates: { status: string; archivedAt: string | null}[];
}

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


export default async function BuildPage({params,}: { params: Promise<{ id: string }>; }) { //{params,}->actual value youre receiving { params: Promise<{ id: string }>; }->what type the value is
    const { id } = await params;       // ✅ unwrap params FIRST
    const build = await getBuild(id);  // ✅ now id is real

    return(
        <>
        <Navbar />
        <main className="p-6 w-full m-0">
            <Link href="/builds" className="inline-block mb-4">
                ← Back
            </Link>

            <h1 className="text-4xl m-0 font-bold bg-gradient-to-r from-jdm-blue to-jdm-green-glow bg-clip-text text-transparent"  >{build.make} {build.model}</h1>
            <h3 className="text-2xl m-0 font-bold bg-gradient-to-r from-jdm-blue to-jdm-green-glow bg-clip-text text-transparent"  >Owner: {build.name}</h3>
            {/* <p className="opacity-[0.7] mt-2" >{build.id}</p> */}

            <h2 className="mt-5" >Pit Updates</h2>
            <LiveUpdates buildId={build.id} initialUpdates={build.updates} />

        </main>
        </>
    );

}