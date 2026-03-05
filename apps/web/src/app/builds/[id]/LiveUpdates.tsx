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

    function Column({ title, items }: { title: string; items: PitUpdate[]; }){
        return(

            <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: 12, minHeight: 120, }} >
                <div style={{ fontWeight: 700, marginBottom: 10 }}>{title}</div>

                {items.length === 0 ? (
                <div style={{ opacity: 0.6, fontSize: 13 }}>Nothing here yet.</div>
                ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {items.map((u) => (
                    <li key={u.id} style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: 12, marginTop: 10, }} >
                        <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                            <strong style={{ textTransform: "uppercase" }}>
                                {(u.severity || "info").toUpperCase()}
                            </strong>
                            <span style={{ opacity: 0.7, fontSize: 12 }}>
                                {new Date(u.createdAt).toLocaleString()}
                            </span>
                        </div>

                        <p style={{ marginTop: 8, marginBottom: 10 }}>{u.message}</p>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {u.status !== "TODO" && (
                                <button onClick={() => setUpdateStatus(u.id, "TODO")} disabled={movingId === u.id} style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "inherit", cursor: "pointer", opacity: movingId === u.id ? 0.6 : 1, }} >
                                Back to TODO
                                </button>
                            )}

                            {u.status !== "IN_PROGRESS" && (
                                <button onClick={() => setUpdateStatus(u.id, "IN_PROGRESS")} disabled={movingId === u.id} style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "inherit", cursor: "pointer", opacity: movingId === u.id ? 0.6 : 1, }} >
                                Start
                                </button>
                            )}

                            {u.status !== "DONE" && (
                                <button onClick={() => setUpdateStatus(u.id, "DONE")} disabled={movingId === u.id} style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "inherit", cursor: "pointer", opacity: movingId === u.id ? 0.6 : 1, }} >
                                Done
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

        <div style={{marginTop: 12}}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.18)", fontSize: 12, opacity: 0.9,}}>
                    {badgeText}
                </span>

                {statusMsg ? (
                    <span style={{ fontSize: 12, opacity: 0.6 }}>{statusMsg}</span>
                ) : null}
            </div>

            <form onSubmit={submitUpdate} style={{ display: "grid", gap:10, marginBottom: 18 }}>
                <div style={{ display: "grid", gap: 8}}>
                    <label style={{ fontSize: 12, opacity: 0.75 }}>New pit update</label>

                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. Installed new brakes" rows={3} style={{width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "inherit", resize: "vertical"}}/>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <select value={severity} onChange={(e) => setSeverity(e.target.value)} style={{padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "inherit"}}>
                            <option value="info">Info</option>
                            <option value="warn">Warn</option>
                            <option value="critical">Critical</option>
                        </select>

                        <button type="submit" disabled={submitting} style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.6)", color: "inherit", cursor: submitting ? "not-allowed" : "pointer"}}>
                            {submitting ? "Saving..." : "Post update"}
                        </button>

                        <span style={{fontSize: 12, opacity: 0.6}}>
                            (socket will append instantly)
                        </span>
                    </div>

                    {formError ? (
                            <div style={{ fontSize: 12, opacity: 0.8}}>
                                ❗ {formError}
                            </div>
                    ): null}
                </div>
            </form>

            {/* {updates.length === 0 ? (
                <p style={{ opacity: 0.7 }}>No updates yet.</p>
            ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0}}>
                    {updates.map((u) => (
                        <li key={u.id} style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: 16, marginTop: 12}}>
                            <div style={{ display: "flex", gap: 12, alignItems: "baseline"}}>
                                <strong style={{ textTransform: "uppercase" }}>
                                    {(u.severity || "info").toUpperCase()}
                                </strong>
                                <span style={{ opacity: 0.7, fontSize: 14}}>
                                    {new Date(u.createdAt).toLocaleString()}
                                </span>
                            </div>
                            <p style={{ marginTop: 8, marginBottom: 0}}>{u.message}</p>
                        </li>
                    ))}
                </ul>
            )} */}

            <div style={{display: "grid", gap: 12, gridTemplateColumns: "repeat(3, minmax(0,1fr))", }} >
                <Column title="TODO" items={todo} />
                <Column title="IN PROGRESS" items={inProg} /> 
                <Column title="DONE" items={done} />
            </div>

        </div>
    );
}