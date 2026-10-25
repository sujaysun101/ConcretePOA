import { z } from "zod";
import { badRequest, requireWorkspace } from "@/lib/api";
import { authorize } from "@/lib/authz";
import { caseToMarkdown, caseToPdf } from "@/lib/report";
import { getCase } from "@/lib/store";

const querySchema = z.object({
  id: z.string().trim().min(1).max(80),
  format: z.enum(["pdf", "md"]).default("pdf"),
});

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireWorkspace();
  if (!session) return response;
  const { id } = await context.params;
  const format = new URL(request.url).searchParams.get("format") ?? "pdf";
  const parsed = querySchema.safeParse({ id, format });
  if (!parsed.success) return badRequest("Choose a pdf or markdown export.");
  try {
    const record = await getCase(session.orgId, parsed.data.id);
    if (!record) return badRequest("That matter is not in this workspace.", 404);

    const authz = authorize(
      session.scope,
      "case:export",
      {
        ownerType: session.scope.type,
        ownerId: session.orgId,
        createdBy: record.userId,
      },
      session.userId
    );
    if (!authz.ok) {
      return badRequest(authz.reason, 403);
    }

    const filename = record.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "report";
    if (parsed.data.format === "md") {
      return new Response(caseToMarkdown(record), {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.md"`,
        },
      });
    }
    const pdf = await caseToPdf(record);
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      },
    });
  } catch {
    return badRequest("The export could not be built.");
  }
}
