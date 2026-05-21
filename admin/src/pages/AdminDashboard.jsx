import { useEffect, useMemo, useState } from "react";
import api from "../lib/axios.js";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [detail, setDetail] = useState(null);
  const [jsonMode, setJsonMode] = useState("fitness");
  const [jsonValue, setJsonValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const adminEmail = localStorage.getItem("admin_email") || "";

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, usersRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/users")
        ]);
        if (!isMounted) return;
        setStats(statsRes.data);
        setUsers(usersRes.data.users || []);
      } catch (error) {
        console.error("Admin load failed", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase();
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(term) || user.email?.toLowerCase().includes(term)
    );
  }, [users, search]);

  const handleViewUser = async (userId) => {
    setDetailLoading(true);
    try {
      const response = await api.get(`/admin/user/${userId}`);
      setSelectedUser(userId);
      setDetail(response.data);
      setJsonMode("fitness");
      setJsonValue(JSON.stringify(response.data.fitnessPlan?.plan_json || {}, null, 2));
    } catch (error) {
      console.error("User detail failed", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSavePlan = async () => {
    try {
      await api.put("/admin/plan", {
        userId: detail.user.id,
        planType: jsonMode,
        planJson: jsonValue
      });
    } catch (error) {
      console.error("Plan save failed", error);
    }
  };

  const handleRegenerate = async (type) => {
    try {
      await api.post("/admin/regenerate", { userId: detail.user.id, planType: type });
      const refreshed = await api.get(`/admin/user/${detail.user.id}`);
      setDetail(refreshed.data);
      if (type === jsonMode) {
        setJsonValue(
          JSON.stringify(
            type === "fitness" ? refreshed.data.fitnessPlan?.plan_json : refreshed.data.dietPlan?.plan_json,
            null,
            2
          )
        );
      }
    } catch (error) {
      console.error("Regenerate failed", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_fittrack_token");
    localStorage.removeItem("admin_key");
    localStorage.removeItem("admin_email");
    window.location.href = "/";
  };

  return (
    <div style={{ minHeight: "100vh", background: "#030712", color: "#e5e7eb" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 28px",
          borderBottom: "1px solid #1f2937"
        }}
      >
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 600 }}>FitTrack Admin</h1>
          <p style={{ fontSize: "12px", color: "#9ca3af" }}>Admin: {adminEmail}</p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: "8px 16px",
            borderRadius: "999px",
            border: "1px solid #1f2937",
            background: "transparent",
            color: "#e5e7eb",
            fontSize: "12px",
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ padding: "24px 28px" }}>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              {[
                { label: "Total Users", value: stats?.totalUsers || 0 },
                { label: "Onboarded", value: stats?.onboardedUsers || 0 },
                { label: "Total Sessions", value: stats?.totalSessions || 0 },
                { label: "Total Meals", value: stats?.totalMealLogs || 0 }
              ].map((card) => (
                <div
                  key={card.label}
                  style={{
                    padding: "16px",
                    borderRadius: "14px",
                    border: "1px solid #1f2937",
                    background: "#111827"
                  }}
                >
                  <p style={{ fontSize: "11px", color: "#9ca3af" }}>{card.label}</p>
                  <p style={{ fontSize: "20px", fontWeight: 600 }}>{card.value}</p>
                </div>
              ))}
            </div>

            <div
              style={{
                padding: "16px",
                borderRadius: "14px",
                border: "1px solid #1f2937",
                background: "#111827"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <h2 style={{ fontSize: "14px", fontWeight: 600 }}>Users</h2>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search"
                  style={{
                    padding: "6px 10px",
                    borderRadius: "10px",
                    border: "1px solid #1f2937",
                    background: "#0f172a",
                    color: "#e5e7eb",
                    fontSize: "12px"
                  }}
                />
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                  <thead style={{ color: "#9ca3af" }}>
                    <tr>
                      <th style={{ textAlign: "left", paddingBottom: "8px" }}>#</th>
                      <th style={{ textAlign: "left", paddingBottom: "8px" }}>Name</th>
                      <th style={{ textAlign: "left", paddingBottom: "8px" }}>Email</th>
                      <th style={{ textAlign: "left", paddingBottom: "8px" }}>Goal</th>
                      <th style={{ textAlign: "left", paddingBottom: "8px" }}>Joined</th>
                      <th style={{ textAlign: "left", paddingBottom: "8px" }}>Onboarding</th>
                      <th style={{ textAlign: "left", paddingBottom: "8px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => (
                      <tr key={user.id} style={{ borderTop: "1px solid #1f2937" }}>
                        <td style={{ padding: "8px 0" }}>{index + 1}</td>
                        <td style={{ padding: "8px 0" }}>{user.name}</td>
                        <td style={{ padding: "8px 0" }}>{user.email}</td>
                        <td style={{ padding: "8px 0" }}>{user.goal}</td>
                        <td style={{ padding: "8px 0" }}>{String(user.created_at).slice(0, 10)}</td>
                        <td style={{ padding: "8px 0" }}>{user.onboarding_done ? "Yes" : "No"}</td>
                        <td style={{ padding: "8px 0" }}>
                          <button
                            onClick={() => handleViewUser(user.id)}
                            style={{
                              padding: "4px 10px",
                              borderRadius: "999px",
                              border: "1px solid #1f2937",
                              background: "transparent",
                              color: "#e5e7eb",
                              fontSize: "11px",
                              cursor: "pointer"
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {detail && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.8)",
            display: "flex",
            justifyContent: "flex-end"
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "#0f172a",
              padding: "20px",
              borderLeft: "1px solid #1f2937",
              overflowY: "auto"
            }}
          >
            <button
              onClick={() => setDetail(null)}
              style={{
                border: "none",
                background: "transparent",
                color: "#9ca3af",
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              Close
            </button>

            {detailLoading ? (
              <p style={{ marginTop: "16px" }}>Loading...</p>
            ) : (
              <div style={{ marginTop: "16px", display: "grid", gap: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: 600 }}>Profile</h3>
                  <p style={{ fontSize: "12px", color: "#9ca3af" }}>
                    Goal: {detail.user.goal}
                  </p>
                  <p style={{ fontSize: "12px", color: "#9ca3af" }}>
                    Equipment: {detail.user.equipment?.join(", ")}
                  </p>
                </div>

                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: 600 }}>Plan Summary</h3>
                  <p style={{ fontSize: "12px", color: "#9ca3af" }}>
                    Fitness days: {detail.fitnessPlan?.plan_json?.weekPlan?.length || 0}
                  </p>
                  <p style={{ fontSize: "12px", color: "#9ca3af" }}>
                    Diet calories: {detail.dietPlan?.daily_calorie_target || 0}
                  </p>
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "#9ca3af" }}>JSON Editor</label>
                  <select
                    value={jsonMode}
                    onChange={(event) => {
                      const mode = event.target.value;
                      setJsonMode(mode);
                      setJsonValue(
                        JSON.stringify(
                          mode === "fitness"
                            ? detail.fitnessPlan?.plan_json || {}
                            : detail.dietPlan?.plan_json || {},
                          null,
                          2
                        )
                      );
                    }}
                    style={{
                      marginTop: "8px",
                      width: "100%",
                      padding: "6px",
                      borderRadius: "10px",
                      border: "1px solid #1f2937",
                      background: "#111827",
                      color: "#e5e7eb"
                    }}
                  >
                    <option value="fitness">Fitness Plan JSON</option>
                    <option value="diet">Diet Plan JSON</option>
                  </select>
                  <textarea
                    value={jsonValue}
                    onChange={(event) => setJsonValue(event.target.value)}
                    rows={10}
                    style={{
                      marginTop: "10px",
                      width: "100%",
                      borderRadius: "12px",
                      border: "1px solid #1f2937",
                      background: "#111827",
                      color: "#e5e7eb",
                      fontFamily: "monospace",
                      fontSize: "11px",
                      padding: "10px"
                    }}
                  />
                  <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                    <button
                      onClick={handleSavePlan}
                      style={{
                        flex: 1,
                        borderRadius: "999px",
                        border: "none",
                        padding: "8px",
                        background: "#6366f1",
                        color: "white",
                        fontSize: "12px",
                        cursor: "pointer"
                      }}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gap: "8px" }}>
                  <button
                    onClick={() => handleRegenerate("fitness")}
                    style={{
                      borderRadius: "999px",
                      border: "1px solid #1f2937",
                      padding: "8px",
                      background: "transparent",
                      color: "#e5e7eb",
                      fontSize: "12px",
                      cursor: "pointer"
                    }}
                  >
                    Regenerate Fitness Plan
                  </button>
                  <button
                    onClick={() => handleRegenerate("diet")}
                    style={{
                      borderRadius: "999px",
                      border: "1px solid #1f2937",
                      padding: "8px",
                      background: "transparent",
                      color: "#e5e7eb",
                      fontSize: "12px",
                      cursor: "pointer"
                    }}
                  >
                    Regenerate Diet Plan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
