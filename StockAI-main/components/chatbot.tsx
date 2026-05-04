"use client";

import { useState } from "react";

type Message = {
  role: "user" | "bot";
  stock?: string;
  predictions?: any;
  final?: string;
  text?: string;
};

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const API_URL = "http://127.0.0.1:5000/predict";

  const extractStock = (text: string): string | null => {
    const match = text.toUpperCase().match(/\b[A-Z-]{2,10}\b/);
    return match ? match[0] : null;
  };

  const getSignal = (action: string, conf: number) => {
    if (action === "BUY") {
      if (conf > 70) return { icon: "⬆️", label: "Strong", color: "text-green-400" };
      if (conf > 55) return { icon: "↗️", label: "Moderate", color: "text-blue-400" };
      return { icon: "➡️", label: "Weak", color: "text-yellow-400" };
    } else {
      if (conf > 70) return { icon: "⬇️", label: "Strong", color: "text-red-400" };
      if (conf > 55) return { icon: "↘️", label: "Moderate", color: "text-orange-400" };
      return { icon: "➡️", label: "Weak", color: "text-yellow-400" };
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: input }]);

    const stock = extractStock(input);

    if (!stock) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Enter valid stock !!" },
      ]);
      setInput("");
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stock }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: data.error },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            stock: data.stock,
            predictions: data.predictions,
            final: data.final,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Server error" },
      ]);
    }

    setInput("");
  };

  return (
    <div className="w-full p-4 rounded-xl bg-gray-900 text-white">
      <h2 className="text-xl font-bold mb-3">Stock Assistant</h2>

      <div className="h-80 overflow-y-auto bg-gray-800 p-3 rounded space-y-2">
        {messages.map((msg, idx) => {
          if (msg.role === "user") {
            return (
              <div key={idx} className="text-right">
                <span className="bg-blue-600 px-3 py-2 rounded">
                  {msg.text}
                </span>
              </div>
            );
          }

          if (msg.predictions) {
            return (
              <div key={idx} className="bg-gray-900 border border-gray-700 p-3 rounded space-y-2">
                <div className="font-bold text-lg">{msg.stock}</div>

                {Object.entries(msg.predictions).map(([k, v]: any) => {
                  const signal = getSignal(v.action, v.confidence);

                  return (
                    <div key={k} className="flex justify-between">
                      <span>{k}</span>
                      <div className="text-right">
                        <div className={`${signal.color} font-semibold`}>
                          {signal.icon} {v.action}
                        </div>
                        <div className="text-sm text-gray-400">
                          {v.confidence}% | {signal.label}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="border-t pt-2 mt-2 font-bold">
                  Final:{" "}
                  <span
                    className={
                      msg.final === "BUY"
                        ? "text-green-400"
                        : msg.final === "SELL"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }
                  >
                    {msg.final}
                  </span>
                </div>
              </div>
            );
          }

          return <div key={idx}>{msg.text}</div>;
        })}
      </div>

      <div className="flex mt-3 gap-2">
        <input
          className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={sendMessage} className="bg-blue-600 px-4 rounded">
          Send
        </button>
      </div>
    </div>
  );
}