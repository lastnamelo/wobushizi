import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET() {
  const csvPath = path.join(process.cwd(), "data", "hanzidb_enhanced.csv");
  const csv = await readFile(csvPath, "utf-8");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="master-list.csv"',
      "Cache-Control": "no-store"
    }
  });
}
