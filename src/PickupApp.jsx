import React, { useState } from "react";
import { Check, Clock, MapPin, Send, Users, ChevronDown, X } from "lucide-react";

const INITIAL_KIDS = [
  { id: 1, name: "Mosada Abeyrathna", school: "Highlands College", status: null, time: "", pickedUp: false },
  { id: 2, name: "Diyon Perera", school: "St. Peter's College", status: null, time: "", pickedUp: false },
  { id: 3, name: "Sethun Athapaththu", school: "Royal Institute", status: null, time: "", pickedUp: false },
  { id: 4, name: "Kiviru Insitha", school: "Vidura College", status: null, time: "", pickedUp: false },
  { id: 5, name: "Dhyaan Weerasooriya", school: "Polymath College", status: null, time: "", pickedUp: false },
  { id: 6, name: "Thunuvi Sooriyabandara", school: "Vidura College", status: null, time: "", pickedUp: false },
  { id: 7, name: "Jayashwin Jayarathna", school: "Leeds International", status: null, time: "", pickedUp: false },
  { id: 8, name: "Vonal", school: "Polymath College", status: null, time: "", pickedUp: false },
  { id: 9, name: "Danuj Kariyawasam", school: "Louvre College", status: null, time: "", pickedUp: false },
  { id: 10, name: "Sharinda Niroshan", school: "Highlands College", status: null, time: "", pickedUp: false },
  { id: 11, name: "Paalinda", school: "Highlands College", status: null, time: "", pickedUp: false },
  { id: 12, name: "Vathsadi Warshakoon", school: "Highlands College", status: null, time: "", pickedUp: false },
  { id: 13, name: "Thenuja Kariyawasam", school: "Louvre College", status: null, time: "", pickedUp: false },
  { id: 14, name: "Vindya Kurakulasooriya", school: "Lyceum Leaf Kottawa", status: null, time: "", pickedUp: false },
  { id: 15, name: "Rayon Wijesundara", school: "Highlands College", status: null, time: "", pickedUp: false },
];

export default function PickupApp() {
  const [kids, setKids] = useState(INITIAL_KIDS);
  const [role, setRole] = useState("manager");
  const [activeKidId, setActiveKidId] = useState(1);
  const [log, setLog] = useState([]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  function addLog(text) {
    const t = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setLog((l) => [{ text, t }, ...l]);
  }

  function setParentResponse(kidId, status, time) {
    setKids((ks) =>
      ks.map((k) => (k.id === kidId ? { ...k, status, time: status === "yes" ? time : "" } : k))
    );
    const kid = kids.find((k) => k.id === kidId);
    if (kid) addLog(`${kid.name} (${kid.school}) marked: ${status === "yes" ? `Pickup needed${time ? " at " + time : ""}` : "No pickup today"}`);
  }

  function markPicked(kidId) {
    setKids((ks) => ks.map((k) => (k.id === kidId ? { ...k, pickedUp: true } : k)));
    const kid = kids.find((k) => k.id === kidId);
    if (kid) addLog(`${kid.name} picked up ✓`);
  }

  function resetDay() {
    setKids((ks) => ks.map((k) => ({ ...k, status: null, time: "", pickedUp: false })));
    setLog([]);
  }

  const needPickup = kids.filter((k) => k.status === "yes");
  const noPickup = kids.filter((k) => k.status === "no");
  const pending = kids.filter((k) => k.status === null);
  const pickedCount = needPickup.filter((k) => k.pickedUp).length;

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
    { id: "staff", label: "Staff" },
    { id: "parent", label: "Parent" },
  ];
  return (
    <div style={styles.roleSwitcher}>
      {roles.map((r) => (
        <button
          key={r.id}
          onClick={() => setRole(r.id)}
          style={{
            ...styles.roleBtn,
            ...(role === r.id ? styles.roleBtnActive : {}),
          }}
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

  return (
    <div style={styles.section}>
      <div style={styles.fieldRow}>
        <label style={styles.fieldLabel}>Select your child</label>
        <select
          value={activeKidId}
          onChange={(e) => setActiveKidId(Number(e.target.value))}
          style={styles.select}
        >
          {kids.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.parentCard}>
        <div style={styles.parentCardHeader}>
          <div style={styles.kidAvatar}>{kid.name.charAt(0)}</div>
          <div>
            <div style={styles.kidName}>{kid.name}</div>
            <div style={styles.kidSub}>{kid.school}</div>
          </div>
        </div>

        <div style={styles.yesNoRow}>
          <button
            onClick={() => setParentResponse(kid.id, "yes", timeInput)}
            style={{
              ...styles.bigChoiceBtn,
              ...(kid.status === "yes" ? styles.bigChoiceBtnYesActive : {}),
            }}
          >
            <Check size={18} style={{ marginRight: 6 }} />
            Yes, pick up
          </button>
          <button
            onClick={() => setParentResponse(kid.id, "no", "")}
            style={{
              ...styles.bigChoiceBtn,
              ...(kid.status === "no" ? styles.bigChoiceBtnNoActive : {}),
            }}
          >
            <X size={18} style={{ marginRight: 6 }} />
            No, not today
          </button>
        </div>

        {kid.status === "yes" && (
          <div style={styles.timeRow}>
            <Clock size={16} color="#8a7a63" />
            <input
              type="text"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              onBlur={() => setParentResponse(kid.id, "yes", timeInput)}
              style={styles.timeInput}
              placeholder="e.g. 3:15 PM"
            />
          </div>
        )}

        {kid.status && (
          <div style={styles.confirmNote}>
            {kid.status === "yes"
              ? `Confirmed — pickup requested${kid.time ? " at " + kid.time : ""}.`
              : "Confirmed — no pickup needed today."}
          </div>
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
          <div style={styles.sectionSub}>
            {pickedCount} of {needPickup.length} picked up
          </div>
        </div>
        <MapPin size={20} color="#8a7a63" />
      </div>

      {needPickup.length === 0 && (
        <div style={styles.emptyState}>No pickups requested yet. List will appear here once parents respond.</div>
      )}

      <div style={styles.staffList}>
        {needPickup.map((k) => (
          <div key={k.id} style={{ ...styles.staffRow, ...(k.pickedUp ? styles.staffRowDone : {}) }}>
            <div>
              <div style={styles.kidName}>{k.name}</div>
              <div style={styles.kidSub}>
                {k.school} · {k.time || "no time given"}
              </div>
            </div>
            {k.pickedUp ? (
              <div style={styles.pickedBadge}>
                <Check size={14} /> Picked
              </div>
            ) : (
              <button onClick={() => markPicked(k.id)} style={styles.pickBtn}>
                Mark picked up
              </button>
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
    ? `Pickup list for today:\n${needPickup
        .map((k, i) => `${i + 1}. ${k.name} — ${k.time || "time TBD"}`)
        .join("\n")}`
    : "No pickups requested yet today.";

  return (
    <div style={styles.section}>
      <div style={styles.statRow}>
        <StatCard label="Need pickup" value={needPickup.length} accent="#b5723a" />
        <StatCard label="Picked up" value={pickedCount} accent="#4f7a5c" />
        <StatCard label="No pickup" value={noPickup.length} accent="#8a7a63" />
        <StatCard label="Awaiting reply" value={pending.length} accent="#a13d3d" />
      </div>

      <div style={styles.managerListBlock}>
        <div style={styles.sectionTitle}>Children</div>
        <div style={styles.managerList}>
          {kids.map((k) => (
            <div key={k.id} style={styles.managerRow}>
              <div>
                <div style={styles.kidName}>{k.name}</div>
                <div style={styles.kidSub}>{k.school}</div>
              </div>
              <StatusPill kid={k} />
            </div>
          ))}
        </div>
      </div>

      <button style={styles.waButton} onClick={() => setWaOpen((o) => !o)}>
        <Send size={16} style={{ marginRight: 8 }} />
        {waOpen ? "Hide WhatsApp message" : "Generate WhatsApp pickup list"}
        <ChevronDown
          size={16}
          style={{ marginLeft: 8, transform: waOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }}
        />
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
          {log.map((l, i) => (
            <div key={i} style={styles.activityRow}>
              <span style={styles.activityTime}>{l.t}</span>
              <span>{l.text}</span>
            </div>
          ))}
        </div>
      </div>

      <button style={styles.resetBtn} onClick={resetDay}>
        Reset for new day
      </button>
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
  if (kid.status === "yes" && kid.pickedUp) {
    return <span style={{ ...styles.pill, ...styles.pillDone }}>Picked up</span>;
  }
  if (kid.status === "yes") {
    return <span style={{ ...styles.pill, ...styles.pillYes }}>Needs pickup{kid.time ? ` · ${kid.time}` : ""}</span>;
  }
  if (kid.status === "no") {
    return <span style={{ ...styles.pill, ...styles.pillNo }}>No pickup</span>;
  }
  return <span style={{ ...styles.pill, ...styles.pillPending }}>Awaiting reply</span>;
}

const styles = {
  app: {
    fontFamily: "'Inter', -apple-system, sans-serif",
    background: "#FBF7F0",
    minHeight: "600px",
    color: "#2e2a24",
    maxWidth: 480,
    margin: "0 auto",
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid #e7ddc9",
  },
  topbar: {
    background: "#2e2a24",
    color: "#FBF7F0",
    padding: "16px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  brand: { display: "flex", alignItems: "center", gap: 10 },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "#b5723a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  brandTitle: { fontWeight: 700, fontSize: 15 },
  brandSub: { fontSize: 12, color: "#cfc6b3" },
  roleSwitcher: { display: "flex", gap: 6, background: "#3d382f", padding: 4, borderRadius: 10 },
  roleBtn: {
    flex: 1,
    border: "none",
    background: "transparent",
    color: "#cfc6b3",
    padding: "8px 0",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  roleBtnActive: { background: "#FBF7F0", color: "#2e2a24" },
  section: { padding: 18 },
  fieldRow: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, color: "#8a7a63", display: "block", marginBottom: 6, fontWeight: 600 },
  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e7ddc9",
    background: "#fff",
    fontSize: 14,
    color: "#2e2a24",
  },
  parentCard: { background: "#fff", borderRadius: 14, padding: 18, border: "1px solid #efe7d6" },
  parentCardHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 18 },
  kidAvatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "#e7ddc9",
    color: "#6b5d44",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },
  kidName: { fontWeight: 700, fontSize: 15 },
  kidSub: { fontSize: 12.5, color: "#8a7a63", marginTop: 2 },
  yesNoRow: { display: "flex", gap: 10 },
  bigChoiceBtn: {
    flex: 1,
    padding: "12px 0",
    borderRadius: 10,
    border: "1.5px solid #e7ddc9",
    background: "#fff",
    fontWeight: 600,
    fontSize: 13.5,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#2e2a24",
  },
  bigChoiceBtnYesActive: { background: "#4f7a5c", color: "#fff", borderColor: "#4f7a5c" },
  bigChoiceBtnNoActive: { background: "#a13d3d", color: "#fff", borderColor: "#a13d3d" },
  timeRow: {
    marginTop: 14,
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#FBF7F0",
    borderRadius: 10,
    padding: "8px 12px",
    border: "1px solid #e7ddc9",
  },
  timeInput: { border: "none", background: "transparent", outline: "none", fontSize: 14, flex: 1, color: "#2e2a24" },
  confirmNote: { marginTop: 14, fontSize: 12.5, color: "#4f7a5c", fontWeight: 600 },
  staffHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontWeight: 700, fontSize: 15 },
  sectionSub: { fontSize: 12.5, color: "#8a7a63", marginTop: 2 },
  staffList: { display: "flex", flexDirection: "column", gap: 8 },
  staffRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fff",
    border: "1px solid #efe7d6",
    borderRadius: 12,
    padding: "12px 14px",
  },
  staffRowDone: { opacity: 0.55 },
  pickBtn: {
    background: "#2e2a24",
    color: "#FBF7F0",
    border: "none",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
  },
  pickedBadge: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    color: "#4f7a5c",
    fontWeight: 700,
    fontSize: 12.5,
  },
  emptyState: {
    fontSize: 13,
    color: "#a89a82",
    background: "#fff",
    border: "1px dashed #e7ddc9",
    borderRadius: 12,
    padding: "18px 14px",
    textAlign: "center",
  },
  statRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 20 },
  statCard: { background: "#fff", border: "1px solid #efe7d6", borderRadius: 12, padding: "12px 6px", textAlign: "center" },
  statValue: { fontSize: 20, fontWeight: 800 },
  statLabel: { fontSize: 10.5, color: "#8a7a63", marginTop: 2, fontWeight: 600 },
  managerListBlock: { marginBottom: 18 },
  managerList: { display: "flex", flexDirection: "column", gap: 8, marginTop: 10 },
  managerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fff",
    border: "1px solid #efe7d6",
    borderRadius: 12,
    padding: "10px 14px",
  },
  pill: { fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 999, whiteSpace: "nowrap" },
  pillYes: { background: "#fbe9da", color: "#b5723a" },
  pillNo: { background: "#eee9e0", color: "#8a7a63" },
  pillPending: { background: "#f5e2e2", color: "#a13d3d" },
  pillDone: { background: "#e1ece3", color: "#4f7a5c" },
  waButton: {
    width: "100%",
    background: "#fff",
    border: "1.5px solid #e7ddc9",
    borderRadius: 10,
    padding: "12px 0",
    fontSize: 13.5,
    fontWeight: 700,
    color: "#2e2a24",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  waBox: { background: "#fff", border: "1px solid #efe7d6", borderRadius: 12, padding: 14, marginBottom: 18 },
  waPre: {
    whiteSpace: "pre-wrap",
    fontFamily: "inherit",
    fontSize: 13,
    margin: 0,
    color: "#2e2a24",
  },
  waHint: { fontSize: 11.5, color: "#a89a82", marginTop: 8 },
  activityBlock: { marginBottom: 18 },
  activityList: { marginTop: 10, display: "flex", flexDirection: "column", gap: 6 },
  activityRow: { fontSize: 12.5, color: "#5c5345", display: "flex", gap: 8 },
  activityTime: { color: "#a89a82", fontVariantNumeric: "tabular-nums" },
  resetBtn: {
    width: "100%",
    background: "transparent",
    border: "1px solid #e7ddc9",
    borderRadius: 10,
    padding: "10px 0",
    fontSize: 12.5,
    fontWeight: 600,
    color: "#8a7a63",
    cursor: "pointer",
  },
};
