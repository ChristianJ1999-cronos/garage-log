"use client"
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";

type Build = {
    id: string;
    name: string;
    make: string;
    model: string;
    createdAt: string;
};

export default function BuildsPage() { 
    const [builds, setBuilds] = useState<Build[]>([]);
    const [confirmDeletedId, setConfirmDeletedId] = useState<string | null>(null);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if(!baseUrl){
        throw new Error("NEXT_PUBLIC_API_URL is not set");
    }

    useEffect( () => {
        async function getBuilds(){
            const res = await fetch(`${baseUrl}/api/builds`, {
                cache: "no-store",
            });
            const data = await res.json();
            setBuilds(data);
        }
        getBuilds();
    }, []);

    async function deleteBuild(id: string){
        await fetch(`${baseUrl}/api/builds/${id}`, {
            method: "DELETE",
        });
        setBuilds( (prev) => prev.filter( (b) => b.id !== id ));
        setConfirmDeletedId(null);
    }

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
                        <div className="flex items-center rounded-xl bg-jdm-bg border border-solid border-jdm-blue-glow/80 overflow-hidden transition-all duration-200 hover:scale-[1.05] hover:border-jdm-green-glow hover:bg-jdm-green group">
                            {
                                <Link href={`/builds/${b.id}`} className="no-underline flex-1 p-5 group-hover:text-black" >
                                    <div className="font-semibold" >{b.make} - {b.model} <br/> Owner: {b.name}</div>
                                    <div className="text-sm opacity-50 mt-3" >{b.id}</div>
                                </Link>
                            }

                            {
                                <div className="px-4 flex flex-col items-end gap-1 py-2">
                                    {confirmDeletedId === b.id ? (
                                        <>
                                            <span className="text-sm text-red-400">Delete?</span>
                                            <button onClick={() => deleteBuild(b.id)} className="px-3 py-1 text-sm rounded-lg border border-red-500 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200 cursor-pointer">
                                                yes
                                            </button>
                                            <button onClick={ () => setConfirmDeletedId(null)} className="px-3 py-1 text-sm rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-600 transition-all duration-200 cursor-pointer">
                                                cancel
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={ () => setConfirmDeletedId(b.id)} className="px-3 py-1 text-sm rounded-lg border border-red-500/40 bg-red-900 text-white hover:bg-red-500/20 hover:text-black transition-all duration-200 cursor-pointer">
                                            Delete
                                        </button>

                                    )}
                                </div>
                            }
                        </div>
                    </li>
                ))}
            </ul>
        </main>
        </>
    );
}