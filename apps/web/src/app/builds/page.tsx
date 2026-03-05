// "use client";

// import { useEffect, useState } from "react";
import Link from "next/link";

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
        <main style={{padding: 24}}>
            <h1 style={{ fontSize: 28, fontWeight: 700 }}>Builds</h1>

            <p style={{ marginTop: 8, opacity: 0.8 }}>
                Click a build to view live pit updates.
            </p>

            <ul style={{ marginTop: 16, display: "grid", gap: 12, padding: 0 }}>
                {builds.map((b) => (
                    <li key={b.id} style={{ listStyle: "none", border: "1px solid rgba(255,255,225,0.15)", borderRadius: 12, padding: 12, }}>
                        <Link href={`/builds/${b.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }} >
                            <div style={{ fontWeight: 600 }}>{b.name}</div>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>{b.id}</div>
                        </Link>
                    </li>
                ))}
            </ul>
        </main>
    );
}