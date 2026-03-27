"use client"
import { useEffect, useState } from "react";
import Navbar from "@/app/components/Navbar";
import { useRouter } from "next/navigation";

export default function NewBuild(){
    const [buildText, setBuildText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string>("");
    const [makes, setMakes] = useState<string[]>([]);
    const [selectedMake, setSelectedMake] = useState("");
    const [models, setModel] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState("");
    const [owner, setOwner] = useState("");
    const router = useRouter();

    useEffect( () => {
        
        async function pullMakes(){
            try{
                const apiMakes = await fetch("https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json");
                const data = await apiMakes.json();

                const JDM_MAKES = ["toyota", "nissan", "honda", "subaru", "mitsubishi", "mazda", "lexus", "acura", "infiniti", "suzuki"];
                const filtered = data.Results.filter( (make: {Make_Name: string} ) => JDM_MAKES.includes(make.Make_Name.toLowerCase())).map( (make: {Make_Name: string} ) => make.Make_Name );
                setMakes(filtered);
            }catch(error){
                return null;
            }
        }
        pullMakes();

        async function pullModels(){
            try{
                const apiModels = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${selectedMake}?format=json`);
                const data = await apiModels.json();
                const modelNames = data.Results.map( (m: {Model_Name: string}) => m.Model_Name );
                setModel(modelNames);
                setSelectedModel("");
            }catch(error){
                return null;
            }
        }
        pullModels();

    }, [selectedMake]);

    async function submitBuild(e: React.FormEvent){
        e.preventDefault();
        
        if(!selectedMake || !selectedModel){
            setFormError("Please select both a make and a model.");
            return;
        }

        setSubmitting(true);
        setFormError("");

        try{
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/builds`, {
                method: "POST",
                headers: { "Content-type": "application/json" },
                body: JSON.stringify({ make: selectedMake, model: selectedModel, name: owner}),
            });

            if(!res.ok){
                const data = await res.json();
                setFormError(data.error ?? "Something went wrong");
                return;
            }
            router.push("/builds");
        }catch(error){
            setFormError("Failed connection to the server.");
        }finally{
            setSubmitting(false);
        }

    }

    return(

        <>
            <Navbar />
            <div className="h-screen place-items-center-safe content-center-safe">
                <form onSubmit={submitBuild} className="gap-2.5 mb-20.5 w-2xl border border-solid border-jdm-blue-glow rounded p-4" >
                    <h1 className="mb-4.5 font-bold ">Submit new car build</h1>
                    <div>
                        <select className={`pl-2 pr-4 mr-4 border border-solid border-jdm-green-glow ${selectedMake ? "bg-jdm-blue" : "bg-jdm-blue-glow/80"} text-white rounded-xl focus:bg-jdm-blue`} id="vehicleBrand" value={selectedMake} onChange={(m) => setSelectedMake(m.target.value)}>
                            <option value="" disabled>Select a make</option>
                            {makes.map((make) => (
                                <option key={make} value={make} >{make}</option>
                            ))}
                        </select>
                        {models.length > 0 && (
                            <select className={`pl-2 pr-4 mr-4 border border-solid border-jdm-green-glow ${selectedModel ? "bg-jdm-blue" : "bg-jdm-blue-glow/80"} text-white rounded-xl focus:bg-jdm-blue selection:bg-jdm-blue`} id="vehicleModel" value={selectedModel} onChange={(m) => setSelectedModel(m.target.value)}>
                                {models.map((model) => (
                                    <option key={model} value={model} >{model}</option>
                                ))}
                            </select>
                        )}
                        <br/><input className="w-[80%] mt-10 border border-solid border-jdm-blue-glow rounded-sm" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Name of owner EX: John Doe..."></input>
                    </div>
                    <br/>
                    {formError && (
                        <div className="mt-3 px-4 py-2 rounded-lg border border-red-500 bg-red-500/20 text-red-400 text-sm">
                            ⚠️ {formError}
                        </div>
                    )}
                    <div className="flex justify-end mr-10 mb-2">
                        <button type="submit" className="mt-8 px-4 py-2.5 rounded-xl border border-jdm-blue bg-jdm-blue/60 text-white font-semibold cursor-pointer hover:brightness-100 hover:text-black transition-all duration-200 hover:scale-[1.05] hover:bg-jdm-blue/80 disabled:opacity-50 disabled:cursor-not-allowed " >Create Build</button>
                    </div>
                </form>
            </div>
        </>
    );

}