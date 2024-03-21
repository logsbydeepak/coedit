"use client";

import dynamic from "next/dynamic";
import React, { useState } from "react";

const Terminal = dynamic(() => import("@/components/terminal"), { ssr: false });

export default function Home() {
  const [WS_URL, setWS_URL] = useState("");

  const [showTerminal, setShowTerminal] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowTerminal(!showTerminal);
  };

  return (
    <div>
      <form onSubmit={handleFormSubmit} className="flex flex-col items-start">
        {!showTerminal && (
          <>
            <label>
              WS_URL:
              <input
                type="text"
                value={WS_URL}
                onChange={(e) => setWS_URL(e.target.value)}
              />
            </label>
          </>
        )}

        <button>{showTerminal ? "Hide Terminal" : "Show Terminal"}</button>
      </form>

      {showTerminal && <Terminal WS_URL={WS_URL} />}
    </div>
  );
}
