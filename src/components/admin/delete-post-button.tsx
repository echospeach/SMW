"use client";

import { C } from "@/lib/theme";

export function DeletePostButton({
  postId,
  action,
}: {
  postId: string;
  action: (postId: string) => Promise<void>;
}) {
  return (
    <form
      action={action.bind(null, postId)}
      onSubmit={(e) => {
        if (!confirm("Permanently delete this post? This can't be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded px-2 py-1 font-mono text-[10px] uppercase"
        style={{ background: C.red, color: C.ink }}
      >
        Delete
      </button>
    </form>
  );
}
