import express from "express";

export function registerEntities(app, client) {
  const router = express.Router();

  // ===== LIST =====
  router.get("/:entity/list", async (req, res) => {
    const { entity } = req.params;
    const limit = req.query.limit || 100;
    try {
      // Validação de segurança para evitar injeção de SQL no nome da tabela
      if (!/^[a-zA-Z0-9_]+$/.test(entity)) {
        return res.status(400).json({ error: "Nome de entidade inválido." });
      }
      const result = await client.query(`SELECT * FROM public.${entity} ORDER BY created_at DESC LIMIT $1`, [limit]);
      res.json(result.rows);
    } catch (err) {
      console.error(`❌ Erro ao listar ${entity}:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // ===== FILTER =====
  router.post("/:entity/filter", async (req, res) => {
    const { entity } = req.params;
    const filters = req.body;
    try {
      if (!/^[a-zA-Z0-9_]+$/.test(entity)) {
        return res.status(400).json({ error: "Nome de entidade inválido." });
      }
      const keys = Object.keys(filters);
      if (keys.length === 0) {
        // Se nenhum filtro for fornecido, retorna todos os registros (comportamento de list)
        const result = await client.query(`SELECT * FROM public.${entity} ORDER BY created_at DESC`);
        return res.json(result.rows);
      }
      const values = Object.values(filters);
      const whereClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(" AND ");
      const query = `SELECT * FROM public.${entity} WHERE ${whereClause} ORDER BY created_at DESC`;
      const result = await client.query(query, values);
      res.json(result.rows);
    } catch (err) {
      console.error(`❌ Erro ao filtrar ${entity}:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // ===== CREATE =====
  router.post("/:entity/create", async (req, res) => {
    const { entity } = req.params;
    const data = req.body;
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(",");
    try {
      if (!/^[a-zA-Z0-9_]+$/.test(entity)) {
        return res.status(400).json({ error: "Nome de entidade inválido." });
      }
      const query = `INSERT INTO public.${entity} (${keys.map(k => `"${k}"`).join(",")}) VALUES (${placeholders}) RETURNING *`;
      const result = await client.query(query, values);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(`❌ Erro ao criar registro em ${entity}:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // ===== UPDATE =====
  router.put("/:entity/update/:id", async (req, res) => {
    const { entity, id } = req.params;
    const data = req.body;
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(", ");
    try {
      if (!/^[a-zA-Z0-9_]+$/.test(entity)) {
        return res.status(400).json({ error: "Nome de entidade inválido." });
      }
      const result = await client.query(
        `UPDATE public.${entity} SET ${setClause}, updated_at = now() WHERE id = $${keys.length + 1} RETURNING *`,
        [...values, id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      console.error(`❌ Erro ao atualizar ${entity}:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // ===== DELETE =====
  router.delete("/:entity/delete/:id", async (req, res) => {
    const { entity, id } = req.params;
    try {
      if (!/^[a-zA-Z0-9_]+$/.test(entity)) {
        return res.status(400).json({ error: "Nome de entidade inválido." });
      }
      await client.query(`DELETE FROM public.${entity} WHERE id = $1`, [id]);
      res.status(200).json({ success: true, message: `Registro ${id} de ${entity} deletado.` });
    } catch (err) {
      console.error(`❌ Erro ao deletar ${entity}:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // Registro no app principal
  app.use("/api", router);
  console.log("🧠 Rotas de Entidades carregadas com sucesso!");
  console.log("✅ CRUD Universal operacional!");
}