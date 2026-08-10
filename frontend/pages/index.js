import { useState } from "react";
import styles from "../styles/Home.module.css";

export default function Home() {
    const [message, setMessage] = useState("");
    const [reply, setReply] = useState("");

    const sendMessage = async () => {
        try {
            console.log("Button clicked, sending:", message);

            const body = JSON.stringify({ message });
            console.log("Outgoing body string:", body);

            const res = await fetch("http://127.0.0.1:8000/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body,
            });

            console.log("Response status:", res.status);
            const text = await res.text();
            console.log("Raw response text:", text);

            // Try to parse JSON safely
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
        }
    };



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
            ></textarea>
            <br />
            <button type="button" className={styles.button} onClick={sendMessage}>Send</button>
            <h2>Response:</h2>
            <p className={styles.reply}>{reply}</p>
        </div>
    );
}
