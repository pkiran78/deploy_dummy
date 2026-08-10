import { useState } from "react";
import styles from "../styles/Home.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function Home() {
    const [message, setMessage] = useState("");
    const [reply, setReply] = useState("");
    const [loading, setLoading] = useState(false);

    // Make sure this function is async because it uses await
    async function sendMessage() {
        try {
            if (!message || !message.trim()) {
                console.log("No message entered");
                return;
            }

            console.log("Button clicked, sending:", message);

            const body = JSON.stringify({ message });
            console.log("Outgoing body string:", body);

            setLoading(true);

            const res = await fetch(`${API_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body,
            });

            console.log("Response status:", res.status);

            const text = await res.text();
            console.log("Raw response text:", text);

            try {
                const data = JSON.parse(text);
                console.log("Parsed JSON:", data);
                setReply(data.reply || JSON.stringify(data));
            } catch (parseErr) {
                console.error("Failed to parse JSON:", parseErr);
                setReply("Invalid JSON response");
            }
        } catch (err) {
            console.error("Error calling backend:", err);
            setReply("Network or server error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>AI Chatbot</h1>

            <textarea
                className={styles.textarea}
                rows="4"
                cols="50"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
            />
            <br />

            <button
                className={styles.button}
                onClick={() => {
                    // ensure sendMessage is called (it is async)
                    sendMessage();
                }}
                disabled={loading}
            >
                {loading ? "Sending..." : "Send"}
            </button>

            <h2>Response:</h2>
            <p className={styles.reply}>{reply}</p>
        </div>
    );
}
