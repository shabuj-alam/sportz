import {Router} from "express";
import {db} from "../db/db.js";
import {commentary} from "../db/schema.js";
import {matchIdParamSchema} from "../validation/matches.js";
import {createCommentarySchema, listCommentaryQuerySchema} from "../validation/commentary.js";
import {desc, eq} from "drizzle-orm";

export const commentaryRouter = Router({ mergeParams: true });

const MAX_LIMIT = 100;

commentaryRouter.get("/", async (req, res) => {
    const paramsParsed = matchIdParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
        return res.status(400).json({ error: 'Invalid match ID', details: paramsParsed.error.issues });
    }

    const queryParsed = listCommentaryQuerySchema.safeParse(req.query);
    if (!queryParsed.success) {
        return res.status(400).json({ error: 'Invalid query parameters', details: queryParsed.error.issues });
    }

    const { limit = 100 } = queryParsed.data;
    const finalLimit = Math.min(limit, MAX_LIMIT);

    try {
        const results = await db
            .select()
            .from(commentary)
            .where(eq(commentary.matchId, paramsParsed.data.id))
            .orderBy(desc(commentary.createdAt))
            .limit(finalLimit);

        res.status(200).json({ data: results });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch commentary', details: e.message });
    }
});

commentaryRouter.post("/", async (req, res) => {
    const paramsParsed = matchIdParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
        return res.status(400).json({ error: 'Invalid match ID', details: paramsParsed.error.issues });
    }

    const bodyParsed = createCommentarySchema.safeParse(req.body);
    if (!bodyParsed.success) {
        return res.status(400).json({ error: 'Invalid payload', details: bodyParsed.error.issues });
    }

    try {
        const [result] = await db.insert(commentary).values({
            ...bodyParsed.data,
            matchId: paramsParsed.data.id,
        }).returning();

        if(res.app.locals.broadcastCommentary) {
            res.app.locals.broadcastCommentary(result.matchId, result);
        }

        res.status(201).json({ data: result });
    } catch (e) {
        res.status(500).json({ error: 'Failed to create commentary', details: e.message });
    }
});