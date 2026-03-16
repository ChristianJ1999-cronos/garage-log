import Link from "next/link";

export default function Navbar(){
    return(
        <nav className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-md bg-jdm-bg/80 px-8 py-4 flex items-center justify-between">
            <Link href="/builds" className="no-underline">
                <span className="font-bold text-xl tracking-widest uppercase bg-gradient-to-r from-jdm-green to-jdm-blue bg-clip-text text-transparent" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    Garage Log
                </span>
            </Link>

            <Link href="/builds/newBuild" className="bg-jdm-blue/90 rounded-xl p-2 pl-3 pr-3 text-white transition-all duration-300 hover:scale-[1.06] hover:text-black" >
                + New Build
            </Link>

        </nav>
    );
}