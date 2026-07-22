import { prisma } from "@/lib/prisma";
import { C, STATUS_META } from "@/lib/theme";
import { deletePost } from "@/lib/actions/admin";
import { DeletePostButton } from "@/components/admin/delete-post-button";
import type { PostStatus } from "@/generated/prisma/enums";

const STATUSES: PostStatus[] = ["DRAFT", "SCHEDULED", "PUBLISHED", "FAILED"];

function isPostStatus(value: string): value is PostStatus {
  return (STATUSES as string[]).includes(value);
}

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const posts = await prisma.post.findMany({
    where: status && isPostStatus(status) ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { email: true } } },
  });

  return (
    <div>
      <h1 className="text-lg font-bold" style={{ color: C.paper }}>
        Content moderation
      </h1>
      <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
        {posts.length} recent posts across all users.
      </p>

      <div className="mt-4 flex gap-1.5">
        {["", "DRAFT", "SCHEDULED", "PUBLISHED", "FAILED"].map((s) => (
          <a
            key={s}
            href={s ? `/admin/content?status=${s}` : "/admin/content"}
            className="rounded-full px-2.5 py-1 font-mono text-[10px] uppercase"
            style={{
              background: (status ?? "") === s ? C.amber : C.raised,
              color: (status ?? "") === s ? C.ink : C.muted,
            }}
          >
            {s || "All"}
          </a>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr style={{ color: C.muted }}>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide">User</th>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide">Platform</th>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide">Status</th>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide">Text</th>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide">Created</th>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide"></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} style={{ borderTop: `1px dashed ${C.line}` }}>
                <td className="py-2 pr-3" style={{ color: C.paper }}>
                  {p.user.email}
                </td>
                <td className="py-2 pr-3" style={{ color: C.muted }}>
                  {p.platformId}
                </td>
                <td className="py-2 pr-3" style={{ color: STATUS_META[p.status].color }}>
                  {STATUS_META[p.status].label}
                </td>
                <td className="max-w-xs truncate py-2 pr-3" style={{ color: C.muted }}>
                  {p.text}
                </td>
                <td className="py-2 pr-3" style={{ color: C.muted }}>
                  {p.createdAt.toLocaleDateString([], { month: "short", day: "numeric" })}
                </td>
                <td className="py-2 pr-3">
                  <DeletePostButton postId={p.id} action={deletePost} />
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={6} className="py-3 text-center" style={{ color: C.muted }}>
                  No posts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
