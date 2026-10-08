// Vercel serverless function: GET /api/referrals
import type { IncomingMessage, ServerResponse } from "node:http";
import { referralsHttp } from "../server/notion.js";

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  const { status, headers, body } = await referralsHttp(process.env);
  res.writeHead(status, headers);
  res.end(body);
}
