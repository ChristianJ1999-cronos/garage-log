
import Link from "next/link";
import Navbar from "../components/Navbar";

type Build = {
    id: string;
    name: string;
    createdAt: string;
};

async function getBuilds(): Promise<Build[]> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if(!baseUrl){
        throw new Error("NEXT_PUBLIC_API_URL is not set");
    }

    const res = await fetch(`${baseUrl}/api/builds`, {
        //prevent Next from caching during dev so you always see latest
        cache: "no-store",
    });

    if(!res.ok){
        throw new Error(`Failed to fetch builds: ${res.status}`);
    }
    return res.json();
}

export default async function BuildsPage() { 
    const builds = await getBuilds();

    return(
        <>
        <Navbar />
        <main className="min-h-screen p-8 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-jdm-green to-jdm-blue to-20% bg-clip-text text-transparent">Garage Log</h1>

            <p className="mt-2 text-zinc-100">
                Click a build to view live pit updates. 
            </p>

            <ul className="mt-4 grid-cols-1 gap-3 p-0">
                {builds.map((b) => (
                    <li key={b.id} className="list-none mb-4" /*style={{ background: 'var(--bg-card)', borderColor: 'var(--blue)',   }} */>
                        <Link href={`/builds/${b.id}`} className="no-underline block border border-solid rounded-xl p-5 bg-jdm-bg border-jdm-blue-glow/80 hover:bg-jdm-green hover:border-jdm-green-glow hover:text-black transition-all duration-200 hover:scale-[1.05]" >
                            <div className="font-semibold" >{b.name}</div>
                            <div className="text-sm opacity-50" >{b.id}</div>
                        </Link>
                    </li>
                ))}
            </ul>
        </main>
        </>
    );
}