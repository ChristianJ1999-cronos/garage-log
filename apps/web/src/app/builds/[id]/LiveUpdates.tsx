"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export type PitStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type PitUpdate = {
    id: string;
    buildId: string;
    message: string;
    severity: string;
    createdAt: string;
    status: PitStatus;
};

type Props = {
    buildId: string;
    initialUpdates: PitUpdate[];
};

type ConnStatus = "connecting" | "connected" | "reconnecting" | "disconnected" | "error";

export default function LiveUpdates({buildId, initialUpdates}: Props){
    //UI state which will change LIVE
    const [updates, setUpdates] = useState<PitUpdate[]>(initialUpdates);

    //socket connection UI state
    const [status, setStatus] = useState<ConnStatus>("connecting");
    const [statusMsg, setStatusMsg] = useState<string>("");

    //form state
    const [message, setMessage] = useState("");
    const [severity, setSeverity] = useState("info");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string>("");

    //tracking which update is currently being moved
    const [movingId, setMovingId] = useState<string>("");

    //keep one socket instance around (dont need to reconnect unnecessarily)
    const socketRef = useRef<Socket | null>(null);

    //where to connect for sockets (same host as API)
    const socketUrl = useMemo(() => {
        const base = process.env.NEXT_PUBLIC_API_URL;
        if(!base) throw new Error("NEXT_PUBLIC_API_URL is not set");
        return base;
    }, []);

    useEffect(() => {
        //creating socket connection
        const socket: Socket = io(socketUrl, {
            transports: ["websocket"], //force real websockets (clean + predictable)
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 500,
            reconnectionDelayMax: 3000,
        });

        socketRef.current = socket;
        setStatus("connecting");
        setStatusMsg("");

        //once connected join the build room
        socket.on("connect", () => {
            console.log("socket connected:", socket.id);
            setStatus("connected");
            setStatusMsg("");
            socket.emit("join:build", buildId);
            console.log("joined room:", buildId);
        });

        socket.on("disconnect", (reason) => {
            //if server goes down, socket.io will try to reconnect automatically
            setStatus("disconnected");
            setStatusMsg(reason);
        });

        //from socket.io manager
        socket.io.on("reconnect_attempt", () => {
            setStatus("reconnecting");
            setStatusMsg("Attempting to reconnect...");
        });

        socket.io.on("reconnect", () => {
            setStatus("connected");
            setStatusMsg("");
            socket.emit("join:build", buildId); // re join the room after connecting
        });

        //debugging if something goes wrong
        socket.on("connect_error", (err) => {
            console.log("connect_error:", err.message);
            setStatus("error");
            setStatusMsg(err.message);
        });

        //listening for new updates coming from server
        socket.on("pit:update:new", (payload: PitUpdate) => {
            //add newest update to the top (also avoids duplicates)
            setUpdates((prev) => {
                if(prev.some((u) => u.id === payload.id)) return prev; //dedupe
                return [payload, ...prev];
            });
        });

        socket.on("pit:update:status", (payload: PitUpdate) => {
            setUpdates((prev) => prev.map((u) => (u.id === payload.id ? payload: u)));
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [buildId, socketUrl]);

    //subnmit handler: POST to the API
    // do NOT optimistic update, BC the socket event will add it instantly.
    async function submitUpdate(e: React.FormEvent){
        e.preventDefault();
        setFormError("");

        const trimmed = message.trim();
        if(!trimmed){
            setFormError("message is required.");
            return;
        }

        try{
            setSubmitting(true);

            const res= await fetch(`${socketUrl}/api/builds/${buildId}/updates`, {
                method: "POST",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify({ message: trimmed, severity }),
            });

            if(!res.ok){
                const text = await res.text().catch(() => "");
                throw new Error(`POST failed (${res.status}). ${text}`);
            }

            setMessage("");
            setSeverity("info");
        } catch(err: any){
            setFormError(err?.message ?? "Something went wrong.");
        } finally{
            setSubmitting(false);
        }
    }

    async function setUpdateStatus(updateId: string, newStatus: PitStatus){
        try{
            setMovingId(updateId);
            const res = await fetch(`${socketUrl}/api/updates/${updateId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify({ status: newStatus }),
            });

            if(!res.ok){
                const text = await res.text().catch(() => "");
                throw new Error(`PATCH failed (${res.status}). ${text}`);
            }

        } catch(e: any){
            alert(e?.message ?? "Failed to update the status!");
        } finally {
            setMovingId("");
        }
    }


    const badgeText = status === "connected"
        ? "Connected"
        : status === "connecting"
        ? "Connecting..."
        : status === "reconnecting"
        ? "Reconnecting..."
        : status === "disconnected"
        ? "Disconnected"
        : "Error";

    //render live list
    // if(updates.length === 0){
    //     return <p>No updates yet.</p>
    // }

    const todo = updates.filter((u) => (u.status ?? "TODO") === "TODO");
    const inProg = updates.filter((u) => (u.status ?? "TODO") === "IN_PROGRESS");
    const done = updates.filter((u) => (u.status ?? "TODO") === "DONE");

    function Column({ title, items, borderClass }: { title: string; items: PitUpdate[]; borderClass: string}){
        return(

            <div className={`border border-solid ${borderClass} rounded-xl p-3 min-h-32 bg-jdm-bg-card`} >
                <div className="font-bold mb-2.5">{title}</div>

                {items.length === 0 ? (
                <div className="text-xs text-jdm-text-muted text-center py-6 tracking-wider uppercase" >Nothing here yet.</div>
                ) : (
                <ul className="list-none p-0 m-0">
                    {items.map((u) => (
                    <li key={u.id} className="border border-white/10 rounded-xl p-3 mt-2.5 bg-jdm-bg hover:border-white/25 transition-all duration-200" >
                        <div className="flex gap-3 items-baseline mb-2">
                            <strong className={`text-xs font-bold uppercase tracking-wider ${
                                u.severity === "critical" ? "text-red-400" :
                                u.severity === "warn" ? "text-jdm-amber" :
                                "text-jdm-blue"
                            }`}>
                                {u.severity.toUpperCase()}
                            </strong>
                            <span className="text-xs text-jdm-text-muted">
                                {new Date(u.createdAt).toLocaleString()}
                            </span>
                        </div>

                        <p className="mt-2 mb-2.5" >{u.message}</p>

                        <div className="flex gap-2 flex-wrap" >
                            {u.status !== "TODO" && (
                                <button 
                                    onClick={() => setUpdateStatus(u.id, "TODO")} 
                                    disabled={movingId === u.id}
                                    className="px-3 py-1 rounded-lg border border-white/15 text-xs text-jdm-text-dim hover:border-red-500/50 hover:text-red-400 transition-all duration-200 disabled:opacity-40 cursor-pointer"
                                >
                                    ↩ TODO
                                </button>
                            )}

                            {u.status !== "IN_PROGRESS" && (
                                <button 
                                    onClick={() => setUpdateStatus(u.id, "IN_PROGRESS")} 
                                    disabled={movingId === u.id}
                                    className="px-3 py-1 rounded-lg border border-white/15 text-xs text-jdm-text-dim hover:border-jdm-blue/50 hover:text-jdm-blue transition-all duration-200 disabled:opacity-40 cursor-pointer"
                                >
                                    ▶ Start
                                </button>
                            )}

                            {u.status !== "DONE" && (
                                <button 
                                    onClick={() => setUpdateStatus(u.id, "DONE")} 
                                    disabled={movingId === u.id}
                                    className="px-3 py-1 rounded-lg border border-white/15 text-xs text-jdm-text-dim hover:border-jdm-green/50 hover:text-jdm-green transition-all duration-200 disabled:opacity-40 cursor-pointer"
                                >
                                    ✓ Done
                                </button>
                            )}
                        </div>
                    </li>
                    ))}
                </ul>
                )}
            </div>

        );
    }


    return(

        <div className="mt-3" >
            <div className="flex items-center gap-2.5 mb-3.5" >
                <span className="px-3 py-1.5 rounded-full border border-white/20 text-xs opacity-90" >
                    {badgeText}
                </span>

                {statusMsg ? (
                    <span className="text-xs text-jdm-text-muted">{statusMsg}</span>
                ) : null}
            </div>

            <form onSubmit={submitUpdate} className="grid gap-2.5 mb-4.5" >
                <div className="grid gap-2" >
                    <label className="text-xs opacity-[.70]" >New pit update</label>

                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. Installed new brakes" rows={3} className="w-full p-3 rounded-xl border border-white/15 bg-transparent text-inherit resize-y focus:outline-none focus:border-jdm-blue transition-colors duration-200" />
                    <div className="flex gap-2.5 items-center" >
                        <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="px-3 py-2.5 rounded-xl border border-white/15 bg-jdm-bg-card text-jdm-text focus:outline-none focus:border-jdm-blue transition-colors duration-200" >
                            <option value="info">Info</option>
                            <option value="warn">Warn</option>
                            <option value="critical">Critical</option>
                        </select>

                        <button type="submit" disabled={submitting} className="px-4 py-2.5 rounded-xl border border-jdm-blue bg-jdm-blue text-jdm-bg font-semibold cursor-pointer hover:brightness-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" >
                            {submitting ? "Saving..." : "Post update"}
                        </button>

                        <span className="text-xs opacity-[.6]" >
                            (socket will append instantly)
                        </span>
                    </div>

                    {formError ? (
                            <div className="text-xs opacity-[.8]" >
                                ❗ {formError}
                            </div>
                    ): null}
                </div>
            </form>
            <div className="grid grid-cols-3 gap-4 mt-4" >
                <Column title="TODO" items={todo} borderClass="border-red-500/80" />
                <Column title="IN PROGRESS" items={inProg} borderClass="border-jdm-blue/80" />
                <Column title="DONE" items={done} borderClass="border-jdm-green/80" />
            </div>

        </div>
    );
}