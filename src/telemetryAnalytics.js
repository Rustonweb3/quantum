// ============================================================
// 🧠 Telemetry Analytics — Fonte Soberana v1.0
// ============================================================
import express from "express";
import pg from "pg";
const router = express.Router();
const { Pool } = pg;
// ============================================================
// 🔹 Conexão com o Banco
// ============================================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
// ============================================================
// 🔹 Função utilitária
// ============================================================
async function runQuery(query, params = []) {
  try {
    const result = await pool.query(query, params);
    return result.rows || [];
  } catch (err) {
    console.error("❌ [TelemetryAnalytics] Erro ao executar query:", err);
    return [];
  }
}
// ============================================================
// 🔹 Endpoint: /api/analytics/telemetry-overview
// ============================================================
router.get("/analytics/telemetry-overview", async (req, res) => {
  console.log("🧠 [TelemetryAnalytics] /analytics/telemetry-overview acionado");

  try {
    const last24h = await runQuery(
      `SELECT event_type, COUNT(*) as total
       FROM telemetry
       WHERE created_date >= NOW() - INTERVAL '24 HOURS'
       GROUP BY event_type
       ORDER BY total DESC;`
    );

    const byEvent = await runQuery(
      `SELECT event_type, COUNT(*) as total
       FROM telemetry
       GROUP BY event_type
       ORDER BY total DESC;`
    );

    res.json({
      last_24h: last24h,
      by_event: byEvent,
      total_events: byEvent.reduce((sum, e) => sum + Number(e.total), 0),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ [TelemetryAnalytics] Erro:", err);
    res.status(500).json({ error: "Erro interno no módulo de telemetria." });
  }
});
// ============================================================
// ✅ Exportação
// ============================================================
export default router;
