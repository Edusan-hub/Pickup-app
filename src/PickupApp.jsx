import React, { useState, useEffect } from "react";
import { Check, Clock, MapPin, Send, ChevronDown, X } from "lucide-react";
import { supabase } from "./supabaseClient";

export default function PickupApp() {
  const [kids, setKids] = useState([]);
  const [log, setLog] = useState([]);
  const [role, setRole] = useState("manager");
  const [activeKidId, setActiveKidId] = useState(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "short", day: "numeric",
  });

  // ── Load initial data ──────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      const { data: kidsData } = await supabase
        .from("kids")
        .select("*")
        .order("id");
      if (kidsData) {
        setKids(kidsData);
        setActiveKidId(kidsData[0]?.id ?? null);
      }

      const { data: logData } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (logData) setLog(logData);

      setLoading(false);
    }
    loadData();
  }, []);

  // ── Real-time subscriptions ────────────────────────────────────
  useEffect(() => {
    const kidsSub = supabase
      .channel("kids-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "kids" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setKids((prev) =>
              prev.map((k) => k.id === payload.new.id ? payload.new : k)
            );
          }
          if (payload.eventType === "INSERT") {
            setKids((prev) => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    const logSub = supabase
      .channel("log-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_log" },
        (payload) => {
          setLog((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(kidsSub);
      supabase.removeChannel(logSub);
    };
  }, []);

  // ── Actions ───────────────────────────────────────────────────
  async function addLog(text) {
    await supabase.from("activity_log").insert({ text });
  }

  async function setParentResponse(kidId, status, time) {
    const kid = kids.find((k) => k.id === kidId);
    await supabase
      .from("kids")
      .update({
        status: status,
        pickup_time: status === "yes" ? time : "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", kidId);
    if (kid && status) {
      await addLog(
        `${kid.name} (${kid.parent_name}): ${
          status === "yes"
            ? `Pickup needed${time ? " at " + time : ""}`
            : "No pickup today"
        }`
      );
    }
  }

  async function markPicked(kidId) {
    const kid = kids.find((k) => k.id === kidId);
    await supabase
      .from("kids")
      .update({ picked_up: true, updated_at: new Date().toISOString() })
      .eq("id", kidId);
    if (kid) await addLog(`${kid.name} picked up ✓`);
  }

  async function resetDay() {
    await supabase
      .from("kids")
      .update({ status: null, pickup_time: "", picked_up: false, updated_at: new Date().toISOString() })
      .neq("id", 0);
    await addLog("Day reset by manager");
    setLog([]);
  }

  // ── Derived state ─────────────────────────────────────────────
  const needPickup = kids.filter((k) => k.status === "yes");
  const noPickup   = kids.filter((k) => k.status === "no");
  const pending    = kids.filter((k) => !k.status);
  const pickedCount = needPickup.filter((k) => k.picked_up).length;

  if (loading) {
    return (
      <div style={{ ...styles.app, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <div style={{ color: "#8a7a63", fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <div style={styles.topbar}>
        <div style={styles.brand}>
          <div style={styles.brandMark}>EM</div>
          <div>
            <div style={styles.brandTitle}>Edusan Montessori</div>
            <div style={styles.brandSub}>Pickup Coordinator · {today}</div>
          </div>
        </div>
        <RoleSwitcher role={role} setRole={setRole} />
      </div>

      {role === "parent" && (
        <ParentView
          kids={kids}
          activeKidId={activeKidId}
          setActiveKidId={setActiveKidId}
          setParentResponse={setParentResponse}
        />
      )}
      {role === "staff" && (
        <StaffView needPickup={needPickup} markPicked={markPicked} pickedCount={pickedCount} />
      )}
      {role === "manager" && (
        <ManagerView
          kids={kids}
          needPickup={needPickup}
          noPickup={noPickup}
          pending={pending}
          pickedCount={pickedCount}
          log={log}
          resetDay={resetDay}
        />
      )}
    </div>
  );
}

function RoleSwitcher({ role, setRole }) {
  const roles = [
    { id: "manager", label: "Manager" },
    { id: "staff",   label: "Staff" },
    { id: "parent",  label: "Parent" },
  ];
  return (
    <div style={styles.roleSwitcher}>
      {roles.map((r) => (
        <button
          key={r.id}
          onClick={() => setRole(r.id)}
          style={{ ...styles.roleBtn, ...(role === r.id ? styles.roleBtnActive : {}) }}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

function ParentView({ kids, activeKidId, setActiveKidId, setParentResponse }) {
  const kid = kids.find((k) => k.id === activeKidId);
  const [timeInput, setTimeInput] = useState("3:00 PM");
  const [pendingChoice, setPendingChoice] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleKidChange = (id) => {
    setActiveKidId(id);
    setPendingChoice(null);
  };

  const handleConfirm = async () => {
    setSaving(true);
    await setParentResponse(kid.id, pendingChoice, pendingChoice === "yes" ? timeInput : "");
    setPendingChoice(null);
    setSaving(false);
  };

  if (!kid) return null;

  return (
    <div style={styles.section}>
      <div style={styles.fieldRow}>
        <label style={styles.fieldLabel}>Select your child</label>
        <select
          value={activeKidId}
          onChange={(e) => handleKidChange(Number(e.target.value))}
          style={styles.select}
        >
          {kids.map((k) => (
            <option key={k.id} value={k.id}>{k.name}</option>
          ))}
        </select>
      </div>

      <div style={styles.parentCard}>
        <div style={styles.parentCardHeader}>
          <div style={styles.kidAvatar}>{kid.name.charAt(0)}</div>
          <div>
            <div style={styles.kidName}>{kid.name}</div>
            <div style={styles.kidSub}>{kid.parent_name}</div>
          </div>
        </div>

        {kid.status && !pendingChoice ? (
          <div>
            <div style={kid.status === "yes" ? styles.confirmedYesBox : styles.confirmedNoBox}>
              {kid.status === "yes" ? (
                <><Check size={16} style={{ marginRight: 6 }} />Pickup requested{kid.pickup_time ? ` at ${kid.pickup_time}` : ""}</>
              ) : (
                <><X size={16} style={{ marginRight: 6 }} />No pickup today</>
              )}
            </div>
            <button
              style={styles.changeBtn}
              onClick={async () => {
                await setParentResponse(kid.id, null, "");
                setPendingChoice(null);
              }}
            >
              Change response
            </button>
          </div>
        ) : (
          <>
            <div style={styles.yesNoRow}>
              <button
                onClick={() => setPendingChoice("yes")}
                style={{ ...styles.bigChoiceBtn, ...(pendingChoice === "yes" ? styles.bigChoiceBtnYesActive : {}) }}
              >
                <Check size={18} style={{ marginRight: 6 }} />Yes, pick up
              </button>
              <button
                onClick={() => setPendingChoice("no")}
                style={{ ...styles.bigChoiceBtn, ...(pendingChoice === "no" ? styles.bigChoiceBtnNoActive : {}) }}
              >
                <X size={18} style={{ marginRight: 6 }} />No, not today
              </button>
            </div>

            {pendingChoice === "yes" && (
              <div style={styles.timeRow}>
                <Clock size={16} color="#8a7a63" />
                <input
                  type="text"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  style={styles.timeInput}
                  placeholder="e.g. 3:15 PM"
                />
              </div>
            )}

            {pendingChoice && (
              <button style={styles.confirmBtn} onClick={handleConfirm} disabled={saving}>
                <Check size={16} style={{ marginRight: 8 }} />
                {saving ? "Saving..." : "Confirm"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StaffView({ needPickup, markPicked, pickedCount }) {
  return (
    <div style={styles.section}>
      <div style={styles.staffHeader}>
        <div>
          <div style={styles.sectionTitle}>Today's pickup list</div>
          <div style={styles.sectionSub}>{pickedCount} of {needPickup.length} picked up</div>
        </div>
        <MapPin size={20} color="#8a7a63" />
      </div>

      {needPickup.length === 0 && (
        <div style={styles.emptyState}>No pickups requested yet. List will appear here once parents respond.</div>
      )}

      <div style={styles.staffList}>
        {needPickup.map((k) => (
          <div key={k.id} style={{ ...styles.staffRow, ...(k.picked_up ? styles.staffRowDone : {}) }}>
            <div>
              <div style={styles.kidName}>{k.name}</div>
              <div style={styles.kidSub}>{k.parent_name} · {k.pickup_time || "no time given"}</div>
            </div>
            {k.picked_up ? (
              <div style={styles.pickedBadge}><Check size={14} /> Picked</div>
            ) : (
              <button onClick={() => markPicked(k.id)} style={styles.pickBtn}>Mark picked up</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ManagerView({ kids, needPickup, noPickup, pending, pickedCount, log, resetDay }) {
  const [waOpen, setWaOpen] = useState(false);

  const waText = needPickup.length
    ? `Pickup list for today:\n${needPickup.map((k, i) => `${i + 1}. ${k.name} — ${k.pickup_time || "time TBD"}`).join("\n")}`
    : "No pickups requested yet today.";

  return (
    <div style={styles.section}>
      <div style={styles.statRow}>
        <StatCard label="Need pickup"    value={needPickup.length} accent="#b5723a" />
        <StatCard label="Picked up"      value={pickedCount}       accent="#4f7a5c" />
        <StatCard label="No pickup"      value={noPickup.length}   accent="#8a7a63" />
        <StatCard label="Awaiting reply" value={pending.length}    accent="#a13d3d" />
      </div>

      <div style={styles.managerListBlock}>
        <div style={styles.sectionTitle}>Children</div>
        <div style={styles.managerList}>
          {kids.map((k) => (
            <div key={k.id} style={styles.managerRow}>
              <div>
                <div style={styles.kidName}>{k.name}</div>
                <div style={styles.kidSub}>{k.parent_name}</div>
              </div>
              <StatusPill kid={k} />
            </div>
          ))}
        </div>
      </div>

      <button style={styles.waButton} onClick={() => setWaOpen((o) => !o)}>
        <Send size={16} style={{ marginRight: 8 }} />
        {waOpen ? "Hide WhatsApp message" : "Generate WhatsApp pickup list"}
        <ChevronDown size={16} style={{ marginLeft: 8, transform: waOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>

      {waOpen && (
        <div style={styles.waBox}>
          <pre style={styles.waPre}>{waText}</pre>
          <div style={styles.waHint}>Copy this into your staff WhatsApp group.</div>
        </div>
      )}

      <div style={styles.activityBlock}>
        <div style={styles.sectionTitle}>Activity</div>
        <div style={styles.activityList}>
          {log.length === 0 && <div style={styles.emptyState}>No activity yet today.</div>}
          {log.map((l) => (
            <div key={l.id} style={styles.activityRow}>
              <span style={styles.activityTime}>
                {new Date(l.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span>{l.text}</span>
            </div>
          ))}
        </div>
      </div>

      <button style={styles.resetBtn} onClick={resetDay}>Reset for new day</button>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statValue, color: accent }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function StatusPill({ kid }) {
  if (kid.status === "yes" && kid.picked_up)
    return <span style={{ ...styles.pill, ...styles.pillDone }}>Picked up</span>;
  if (kid.status === "yes")
    return <span style={{ ...styles.pill, ...styles.pillYes }}>Needs pickup{kid.pickup_time ? ` · ${kid.pickup_time}` : ""}</span>;
  if (kid.status === "no")
    return <span style={{ ...styles.pill, ...styles.pillNo }}>No pickup</span>;
  return <span style={{ ...styles.pill, ...styles.pillPending }}>Awaiting reply</span>;
}

const styles = {
  app: { fontFamily: "'Inter', -apple-system, sans-serif", background: "#FBF7F0", minHeight: "600px", color: "#2e2a24", maxWidth: 480, margin: "0 auto", borderRadius: 16, overflow: "hidden", border: "1px solid #e7ddc9" },
  topbar: { background: "#2e2a24", color: "#FBF7F0", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 },
  brand: { display: "flex", alignItems: "center", gap: 10 },
  brandMark: { width: 36, height: 36, borderRadius: 10, background: "#b5723a", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, letterSpacing: 0.5 },
  brandTitle: { fontWeight: 700, fontSize: 15 },
  brandSub: { fontSize: 12, color: "#cfc6b3" },
  roleSwitcher: { display: "flex", gap: 6, background: "#3d382f", padding: 4, borderRadius: 10 },
  roleBtn: { flex: 1, border: "none", background: "transparent", color: "#cfc6b3", padding: "8px 0", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer" },
  roleBtnActive: { background: "#FBF7F0", color: "#2e2a24" },
  section: { padding: 18 },
  fieldRow: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, color: "#8a7a63", display: "block", marginBottom: 6, fontWeight: 600 },
  select: { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e7ddc9", background: "#fff", fontSize: 14, color: "#2e2a24" },
  parentCard: { background: "#fff", borderRadius: 14, padding: 18, border: "1px solid #efe7d6" },
  parentCardHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 18 },
  kidAvatar: { width: 44, height: 44, borderRadius: "50%", background: "#e7ddc9", color: "#6b5d44", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 },
  kidName: { fontWeight: 700, fontSize: 15 },
  kidSub: { fontSize: 12.5, color: "#8a7a63", marginTop: 2 },
  yesNoRow: { display: "flex", gap: 10 },
  bigChoiceBtn: { flex: 1, padding: "12px 0", borderRadius: 10, border: "1.5px solid #e7ddc9", background: "#fff", fontWeight: 600, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#2e2a24" },
  bigChoiceBtnYesActive: { background: "#4f7a5c", color: "#fff", borderColor: "#4f7a5c" },
  bigChoiceBtnNoActive: { background: "#a13d3d", color: "#fff", borderColor: "#a13d3d" },
  timeRow: { marginTop: 14, display: "flex", alignItems: "center", gap: 8, background: "#FBF7F0", borderRadius: 10, padding: "8px 12px", border: "1px solid #e7ddc9" },
  timeInput: { border: "none", background: "transparent", outline: "none", fontSize: 14, flex: 1, color: "#2e2a24" },
  confirmBtn: { width: "100%", marginTop: 14, padding: "13px 0", background: "#2e2a24", color: "#FBF7F0", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  confirmedYesBox: { display: "flex", alignItems: "center", background: "#e1ece3", color: "#4f7a5c", fontWeight: 700, fontSize: 14, padding: "13px 14px", borderRadius: 10, marginBottom: 10 },
  confirmedNoBox: { display: "flex", alignItems: "center", background: "#eee9e0", color: "#8a7a63", fontWeight: 700, fontSize: 14, padding: "13px 14px", borderRadius: 10, marginBottom: 10 },
  changeBtn: { width: "100%", background: "transparent", border: "1px solid #e7ddc9", borderRadius: 10, padding: "9px 0", fontSize: 12.5, fontWeight: 600, color: "#8a7a63", cursor: "pointer" },
  staffHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontWeight: 700, fontSize: 15 },
  sectionSub: { fontSize: 12.5, color: "#8a7a63", marginTop: 2 },
  staffList: { display: "flex", flexDirection: "column", gap: 8 },
  staffRow: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", border: "1px solid #efe7d6", borderRadius: 12, padding: "12px 14px" },
  staffRowDone: { opacity: 0.55 },
  pickBtn: { background: "#2e2a24", color: "#FBF7F0", border: "none", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  pickedBadge: { display: "flex", alignItems: "center", gap: 4, color: "#4f7a5c", fontWeight: 700, fontSize: 12.5 },
  emptyState: { fontSize: 13, color: "#a89a82", background: "#fff", border: "1px dashed #e7ddc9", borderRadius: 12, padding: "18px 14px", textAlign: "center" },
  statRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 20 },
  statCard: { background: "#fff", border: "1px solid #efe7d6", borderRadius: 12, padding: "12px 6px", textAlign: "center" },
  statValue: { fontSize: 20, fontWeight: 800 },
  statLabel: { fontSize: 10.5, color: "#8a7a63", marginTop: 2, fontWeight: 600 },
  managerListBlock: { marginBottom: 18 },
  managerList: { display: "flex", flexDirection: "column", gap: 8, marginTop: 10 },
  managerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", border: "1px solid #efe7d6", borderRadius: 12, padding: "10px 14px" },
  pill: { fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 999, whiteSpace: "nowrap" },
  pillYes: { background: "#fbe9da", color: "#b5723a" },
  pillNo: { background: "#eee9e0", color: "#8a7a63" },
  pillPending: { background: "#f5e2e2", color: "#a13d3d" },
  pillDone: { background: "#e1ece3", color: "#4f7a5c" },
  waButton: { width: "100%", background: "#fff", border: "1.5px solid #e7ddc9", borderRadius: 10, padding: "12px 0", fontSize: 13.5, fontWeight: 700, color: "#2e2a24", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  waBox: { background: "#fff", border: "1px solid #efe7d6", borderRadius: 12, padding: 14, marginBottom: 18 },
  waPre: { whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 13, margin: 0, color: "#2e2a24" },
  waHint: { fontSize: 11.5, color: "#a89a82", marginTop: 8 },
  activityBlock: { marginBottom: 18 },
  activityList: { marginTop: 10, display: "flex", flexDirection: "column", gap: 6 },
  activityRow: { fontSize: 12.5, color: "#5c5345", display: "flex", gap: 8 },
  activityTime: { color: "#a89a82", fontVariantNumeric: "tabular-nums" },
  resetBtn: { width: "100%", background: "transparent", border: "1px solid #e7ddc9", borderRadius: 10, padding: "10px 0", fontSize: 12.5, fontWeight: 600, color: "#8a7a63", cursor: "pointer" },
};
