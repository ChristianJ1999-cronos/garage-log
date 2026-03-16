"use client"
import { useEffect, useState } from "react";
import Navbar from "@/app/components/Navbar";

export default function NewBuild(){
    const [buildText, setBuildText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string>("");
    const [makes, setMakes] = useState<string[]>([]);
    const [selectedMake, setSelectedMake] = useState("");

    useEffect( () => {
        
        async function pullMakes(){
            try{
                const apiMakes = await fetch("https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json");
                const data = await apiMakes.json();

                const JDM_MAKES = ["Toyota", "Nissan", "Honda", "Subaru", "Mitsubishi", "Mazda", "Lexus", "Acura", "Infiniti", "Suzuki"];
                const filtered = data.Results.filter( (make: {Make_Name: string} ) => JDM_MAKES.includes(make.Make_Name)).map( (make: {Make_Name: string} ) => make.Make_Name );
                setMakes(filtered);
            }catch(error){
                return null;
            }
        }
        pullMakes();
    }, []);

    function submitBuild(e: React.FormEvent){
        e.preventDefault();
        console.log("submission worked!")
        const trimming = buildText.trim();
        if(!trimming){
            setFormError("Need to insert a build to submit");
        }

        try{

        }catch(error){
            
        }

    }

    return(

        <>
            <Navbar />
            <div className="h-screen place-items-center-safe content-center-safe">
                <form onSubmit={submitBuild} className="gap-2.5 mb-4.5 w-2xl border border-solid border-jdm-blue-glow rounded p-4" >
                    <h1 className="mb-1.5 font-bold ">Submit new car build</h1>
                    <input value={buildText} onChange={ (e) => setBuildText(e.target.value)} placeholder="e.g. Nissan Skyline R34" className="w-full border border-solid border-jdm-green-glow h-8 mb-4" />

                    <button type="submit" className="px-4 py-2.5 rounded-xl border border-jdm-blue bg-jdm-blue/60 text-white font-semibold cursor-pointer hover:brightness-100 hover:text-black transition-all duration-200 hover:scale-[1.05] hover:bg-jdm-blue/80 disabled:opacity-50 disabled:cursor-not-allowed " >Create Build</button>
                </form>
            </div>
        </>
    );

}