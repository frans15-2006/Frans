import { useState, useRef, useEffect } from "react";

const AGENTS = [
  {
    id: "opus", name: "OPUS", role: "FULL-STACK DEV", color: "#22d3ee",
    system: "You are OPUS, representing Claude Opus 4.8 in a multi-agent dev council called JARVIS. Your role: write frontend and backend code from scratch. Produce clean, production-ready code. Use code blocks. Be precise and direct. Max 140 words. Zero filler."
  },
  {
    id: "gpt", name: "GPT", role: "SOLUTIONS ARCHITECT", color: "#a78bfa",
    system: "You are GPT, representing GPT-5.5 in a multi-agent dev council called JARVIS. Your role: design database schemas and plan system architecture. Think in data models, API contracts, scalability, and infrastructure tradeoffs. Be concrete and decisive. Max 140 words. No filler."
  },
  {
    id: "gemini", name: "GEMINI", role: "LOG ANALYZER", color: "#f97316",
    system: "You are GEMINI, representing Gemini 3.1 Pro in a multi-agent dev council called JARVIS. Your role: read and interpret error logs and crash reports. Pinpoint root causes, stack traces, and failure patterns with ruthless precision. Max 140 words."
  },
  {
    id: "deepseek", name: "DEEPSEEK", role: "DEVOPS ENGINEER", color: "#4ade80",
    system: "You are DEEPSEEK, representing DeepSeek-V4-Pro in a multi-agent dev council called JARVIS. Your role: write deployment scripts, CI/CD pipelines, and automation to push apps live. Output shell scripts, Docker configs, or YAML. Be direct and operational. Max 140 words."
  },
  {
    id: "grok", name: "GROK", role: "SITE RELIABILITY MONITOR", color: "#fbbf24",
    system: "You are GROK, representing Grok 4.20 in a multi-agent dev council called JARVIS. You receive outputs from OPUS (full-stack dev), GPT (architect), GEMINI (log analyzer), and DEEPSEEK (devops). Synthesize all into one decisive reliability verdict and action plan. Alert on risks. No hedging. Max 180 words."
  }
];

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  ].join(",");
}

async function callAgent(agent, messages) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: agent.system,
      messages
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text || "[No response]";
}

function renderContent(text, agentColor) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const lines = part.slice(3, -3).split("\n");
      const lang = lines[0].trim();
      const code = lines.slice(lang ? 1 : 0).join("\n").trim();
      const rgb = hexToRgb(agentColor);
      return (
        <div key={i} style={{ margin: "12px 0" }}>
          {lang && (
            <div style={{
              display: "inline-block",
              fontSize: "8px", letterSpacing: "2.5px",
              color: agentColor,
              background: `rgba(${rgb}, 0.1)`,
              padding: "3px 10px",
              fontFamily: "var(--jb)"
            }}>
              {lang.toUpperCase()}
            </div>
          )}
          <pre style={{
            background: "#020210",
            border: "1px solid #0a0a22",
            borderLeft: `3px solid ${agentColor}`,
            padding: "14px 16px",
            margin: 0,
            overflowX: "auto",
            fontSize: "12px",
            lineHeight: "1.7",
            color: "#c0c0dc",
            fontFamily: "var(--jb)",
            whiteSpace: "pre"
          }}>
            <code>{code}</code>
          </pre>
        </div>
      );
    }
    return <span key={i} style={{ whiteSpace: "pre-wrap" }}>{part}</span>;
  });
}

function AgentCard({ agent, response, isActive }) {
  const rgb = hexToRgb(agent.color);
  const hasContent = response || isActive;
  const isVerdict = agent.id === "grok";
  const isDone = !!response;

  return (
    <div style={{
      marginBottom: "6px",
      borderTop: `1px solid ${hasContent ? `rgba(${rgb}, 0.15)` : "#06061a"}`,
      borderRight: `1px solid ${hasContent ? `rgba(${rgb}, 0.08)` : "#06061a"}`,
      borderBottom: `1px solid ${hasContent ? `rgba(${rgb}, 0.08)` : "#06061a"}`,
      borderLeft: `3px solid ${hasContent ? agent.color : "#0d0d30"}`,
      background: isVerdict && isDone
        ? `rgba(${rgb}, 0.055)`
        : isDone
          ? `rgba(${rgb}, 0.018)`
          : "#03030e",
      transition: "all 0.35s ease",
      boxShadow: isActive
        ? `0 0 24px rgba(${rgb}, 0.1), inset 0 0 40px rgba(${rgb}, 0.015)`
        : isVerdict && isDone
          ? `0 0 50px rgba(${rgb}, 0.07)`
          : "none"
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        padding: isVerdict && isDone ? "11px 14px" : "9px 14px",
        borderBottom: hasContent ? `1px solid rgba(${rgb}, 0.07)` : "none",
        background: isVerdict && isDone ? `rgba(${rgb}, 0.04)` : "transparent"
      }}>
        <div style={{
          width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0,
          background: hasContent ? agent.color : "#0c0c30",
          boxShadow: isActive
            ? `0 0 0 3px rgba(${rgb}, 0.12), 0 0 10px ${agent.color}`
            : isDone ? `0 0 6px rgba(${rgb}, 0.3)` : "none",
          transition: "all 0.3s",
          animation: isActive ? "throb 1s ease-in-out infinite" : "none"
        }} />
        <span style={{
          fontFamily: "var(--jb)", fontSize: "11px", letterSpacing: "4px",
          fontWeight: "700",
          color: hasContent ? agent.color : "#0e0e38",
          transition: "color 0.3s", flex: "0 0 auto"
        }}>
          {agent.name}
        </span>
        <div style={{ width: "1px", height: "9px", background: `rgba(${rgb}, 0.18)`, flex: "0 0 auto" }} />
        <span style={{
          fontFamily: "var(--jb)", fontSize: "8px", letterSpacing: "2px",
          color: hasContent ? `rgba(${rgb}, 0.45)` : "#0c0c30",
          flex: 1, transition: "color 0.3s"
        }}>
          {agent.role}
        </span>
        {isVerdict && isDone && (
          <span style={{
            fontFamily: "var(--jb)", fontSize: "7px", letterSpacing: "2.5px",
            color: agent.color,
            border: `1px solid rgba(${rgb}, 0.45)`,
            padding: "2px 8px",
            background: `rgba(${rgb}, 0.1)`
          }}>
            VERDICT
          </span>
        )}
        {isActive && (
          <span style={{
            fontFamily: "var(--jb)", fontSize: "7px", letterSpacing: "2px",
            color: agent.color, opacity: 0.7,
            animation: "throb 1.2s ease-in-out infinite"
          }}>
            PROCESSING
          </span>
        )}
        {isDone && (
          <span style={{ fontFamily: "var(--jb)", fontSize: "9px", color: `rgba(${rgb}, 0.35)` }}>
            checkmark
          </span>
        )}
      </div>
      {hasContent && (
        <div style={{ padding: "12px 14px 14px" }}>
          {response && (
            <div style={{
              fontFamily: "var(--jb)", fontSize: "12.5px",
              lineHeight: "1.85", color: "#a8a8c4"
            }}>
              {renderContent(response, agent.color)}
            </div>
          )}
          {isActive && !response && (
            <div style={{
              fontFamily: "var(--jb)", color: agent.color,
              fontSize: "18px", letterSpacing: "6px", opacity: 0.7,
              animation: "ellipsis 1.4s ease-in-out infinite"
            }}>
              ...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Jarvis() {
  const [input, setInput] = useState("");
  const [sessions, setSessions] = useState([]);
  const [running, setRunning] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);
  const [stepIdx, setStepIdx] = useState(0);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, activeAgent]);

  const buildHistory = (prevSessions) => {
    const messages = [];
    for (const s of prevSessions) {
      if (!s.agentResponses.length) continue;
      messages.push({ role: "user", content: s.userMsg });
      const combined = s.agentResponses
        .map(r => {
          const a = AGENTS.find(x => x.id === r.agentId);
          return `[${a.name} - ${a.role}]: ${r.text}`;
        })
        .join("\n\n");
      messages.push({ role: "assistant", content: combined });
    }
    return messages;
  };

  const run = async () => {
    if (!input.trim() || running) return;
    const userMsg = input.trim();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setRunning(true);
    setStepIdx(0);

    const capturedSessions = [...sessions];
    const sessionIdx = capturedSessions.length;
    setSessions(prev => [...prev, { userMsg, agentResponses: [] }]);

    const history = buildHistory(capturedSessions);
    const currentResponses = [];

    for (let i = 0; i < AGENTS.length; i++) {
      const agent = AGENTS[i];
      setActiveAgent(agent.id);
      setStepIdx(i + 1);

      let userContent = userMsg;
      if (currentResponses.length > 0) {
        const ctx = currentResponses
          .map(r => {
            const a = AGENTS.find(x => x.id === r.agentId);
            return `[${a.name} - ${a.role}]: ${r.text}`;
          })
          .join("\n\n");
        userContent = `Query: ${userMsg}\n\nCouncil so far:\n${ctx}\n\nNow give your response.`;
      }

      try {
        const text = await callAgent(agent, [
          ...history,
          { role: "user", content: userContent }
        ]);
        currentResponses.push({ agentId: agent.id, text });
      } catch (err) {
        currentResponses.push({ agentId: agent.id, text: `[Error: ${err.message}]` });
      }

      setSessions(prev => {
        const updated = [...prev];
        updated[sessionIdx] = { userMsg, agentResponses: [...currentResponses] };
        return updated;
      });
    }

    setActiveAgent(null);
    setRunning(false);
    setStepIdx(0);
    textareaRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      run();
    }
  };

  const handleChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const clearSessions = () => {
    if (!running) setSessions([]);
  };

  const activeAgentObj = AGENTS.find(a => a.id === activeAgent);
  const progressPct = running ? (stepIdx / AGENTS.length) * 100 : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300;0,400;0,700;1,400&display=swap');
        :root { --jb: 'JetBrains Mono', 'Courier New', monospace; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #0e0e30; border-radius: 2px; }
        @keyframes throb {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(0.82); }
        }
        @keyframes ellipsis {
          0% { opacity: 1; } 33% { opacity: 0.15; } 66% { opacity: 0.55; } 100% { opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -300% center; }
          100% { background-position: 300% center; }
        }
        .session-enter { animation: fadeUp 0.4s ease forwards; }
        textarea { font-family: var(--jb) !important; caret-color: #a78bfa; outline: none; }
        textarea::placeholder { color: #141440; }
        textarea:focus { border-color: #1a1a50 !important; }
        .send-btn { transition: all 0.2s ease; }
        .send-btn:hover:not(:disabled) { background: #08082a !important; border-color: #2828a0 !important; color: #fff !important; }
        .send-btn:active:not(:disabled) { transform: scale(0.96); }
        .clear-btn { transition: all 0.2s ease; }
        .clear-btn:hover { color: #ff4444 !important; border-color: #2a0808 !important; }
      `}</style>

      <div style={{
        display: "flex", flexDirection: "column", height: "100vh",
        background: "#010108", fontFamily: "var(--jb)",
        backgroundImage: [
          "radial-gradient(ellipse at 10% 0%, rgba(34,211,238,0.035) 0%, transparent 45%)",
          "radial-gradient(ellipse at 90% 100%, rgba(251,191,36,0.035) 0%, transparent 45%)",
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.022) 1px, transparent 0)"
        ].join(", "),
        backgroundSize: "auto, auto, 28px 28px"
      }}>

        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: "2px", zIndex: 200, overflow: "hidden"
        }}>
          <div style={{
            height: "100%", width: `${progressPct}%`,
            background: activeAgentObj
              ? `linear-gradient(90deg, ${activeAgentObj.color}88, ${activeAgentObj.color}, #ffffff55, ${activeAgentObj.color})`
              : "transparent",
            backgroundSize: "300% auto",
            animation: running ? "shimmer 1.6s linear infinite" : "none",
            transition: "width 0.6s ease",
            boxShadow: activeAgentObj ? `0 0 10px ${activeAgentObj.color}` : "none"
          }} />
        </div>

        <div style={{
          flexShrink: 0, padding: "11px 20px 11px 22px",
          borderBottom: "1px solid #07071e",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(1,1,8,0.98)", backdropFilter: "blur(16px)",
          position: "relative", zIndex: 10
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <span style={{
              fontSize: "15px", letterSpacing: "11px", color: "#ffffff",
              fontWeight: "700", fontFamily: "var(--jb)"
            }}>JARVIS</span>
            <span style={{
              fontSize: "8px", letterSpacing: "2px",
              color: running && activeAgentObj ? activeAgentObj.color : "#181844",
              transition: "color 0.4s"
            }}>
              {running ? `${stepIdx} / ${AGENTS.length}` : "5-AGENT COUNCIL"}
            </span>
          </div>

          <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            {AGENTS.map((a, i) => {
              const isAct = activeAgent === a.id;
              const rgb = hexToRgb(a.color);
              const lit = isAct
                || (running && stepIdx > i + 1)
                || (!running && sessions.length > 0 && sessions[sessions.length - 1]?.agentResponses?.find(r => r.agentId === a.id));
              return (
                <div key={a.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                  <div style={{
                    width: "5px", height: "5px", borderRadius: "50%",
                    background: isAct ? a.color : lit ? `rgba(${rgb}, 0.4)` : "#0a0a28",
                    boxShadow: isAct ? `0 0 8px ${a.color}, 0 0 16px rgba(${rgb}, 0.4)` : "none",
                    transition: "all 0.3s",
                    animation: isAct ? "throb 1s ease-in-out infinite" : "none"
                  }} />
                  <span style={{
                    fontSize: "7px", letterSpacing: "0.5px",
                    color: isAct ? a.color : lit ? `rgba(${rgb}, 0.32)` : "#101030",
                    transition: "color 0.3s"
                  }}>{a.name}</span>
                </div>
              );
            })}
            {sessions.length > 0 && !running && (
              <button className="clear-btn" onClick={clearSessions} style={{
                background: "transparent", color: "#16163a",
                border: "1px solid #0a0a28",
                padding: "4px 10px", fontSize: "7px", letterSpacing: "2px",
                cursor: "pointer", fontFamily: "var(--jb)", marginLeft: "4px"
              }}>CLEAR</button>
            )}
          </div>
        </div>

        <div style={{
          flex: 1, overflowY: "auto", padding: "20px 22px",
          display: "flex", flexDirection: "column"
        }}>
          {sessions.length === 0 && (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: "18px", userSelect: "none"
            }}>
              <div style={{ fontSize: "48px", lineHeight: 1, color: "#ffffff", opacity: 0.06, letterSpacing: "4px" }}>
                O
              </div>
              <div style={{ fontSize: "9px", letterSpacing: "7px", color: "#ffffff", opacity: 0.07 }}>
                COUNCIL STANDING BY
              </div>
              <div style={{ display: "flex", gap: "18px" }}>
                {AGENTS.map(a => (
                  <div key={a.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", opacity: 0.12 }}>
                    <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: a.color }} />
                    <span style={{ fontSize: "7px", letterSpacing: "1px", color: a.color }}>{a.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sessions.map((session, sIdx) => {
            const isCurrent = sIdx === sessions.length - 1 && running;
            return (
              <div key={sIdx} className="session-enter" style={{ marginBottom: "36px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                  <span style={{
                    fontSize: "7px", letterSpacing: "3px",
                    color: "#111136", fontFamily: "var(--jb)", flexShrink: 0
                  }}>SESSION {String(sIdx + 1).padStart(2, "0")}</span>
                  <div style={{ flex: 1, height: "1px", background: "#06061a" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "14px" }}>
                  <div style={{
                    background: "#05051a", border: "1px solid #0d0d2e",
                    borderRight: "3px solid #1c1c60",
                    padding: "10px 14px", maxWidth: "66%"
                  }}>
                    <div style={{ fontSize: "7px", letterSpacing: "2.5px", color: "#1c1c60", marginBottom: "6px", fontFamily: "var(--jb)" }}>
                      QUERY
                    </div>
                    <div style={{ fontSize: "13px", lineHeight: "1.65", color: "#ccccde", fontFamily: "var(--jb)" }}>
                      {session.userMsg}
                    </div>
                  </div>
                </div>

                <div>
                  {AGENTS.map(agent => {
                    const respObj = session.agentResponses.find(r => r.agentId === agent.id);
                    const isActive = isCurrent && activeAgent === agent.id;
                    if (!respObj && !isActive) return null;
                    return (
                      <AgentCard key={agent.id} agent={agent} response={respObj?.text} isActive={isActive} />
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div style={{
          flexShrink: 0, padding: "10px 22px 13px",
          borderTop: "1px solid #07071e",
          background: "rgba(1,1,8,0.99)"
        }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <span style={{
                position: "absolute", left: "11px", top: "10px",
                color: "#1a1a4a", fontSize: "14px",
                pointerEvents: "none", userSelect: "none", fontFamily: "var(--jb)"
              }}>›</span>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleChange}
                onKeyDown={handleKey}
                disabled={running}
                placeholder={running ? "Council processing..." : "Query the council..."}
                rows={1}
                style={{
                  width: "100%", background: "#020214",
                  border: "1px solid #0b0b2a", color: "#d0d0e8",
                  fontSize: "13px", padding: "10px 12px 10px 26px",
                  resize: "none", lineHeight: "1.55", overflow: "hidden",
                  opacity: running ? 0.38 : 1,
                  transition: "opacity 0.2s, border-color 0.2s",
                  fontFamily: "var(--jb)"
                }}
              />
            </div>
            <button
              className="send-btn" onClick={run}
              disabled={running || !input.trim()}
              style={{
                background: "transparent",
                color: running || !input.trim() ? "#121240" : "#c8c8f0",
                border: `1px solid ${running || !input.trim() ? "#0a0a28" : "#1c1c5a"}`,
                padding: "10px 16px", fontSize: "10px", letterSpacing: "2.5px",
                cursor: running || !input.trim() ? "default" : "pointer",
                flexShrink: 0, fontFamily: "var(--jb)"
              }}
            >
              {running ? "..." : "SEND"}
            </button>
          </div>
          <div style={{
            marginTop: "6px", fontSize: "7px", letterSpacing: "1.5px",
            color: "#090926", fontFamily: "var(--jb)"
          }}>
            ENTER TO SEND  |  SHIFT+ENTER FOR NEWLINE  |  CONTEXT SHARED ACROSS ROUNDS
          </div>
        </div>
      </div>
    </>
  );
}
