"use client";

import type { MouseEvent } from "react";
import { deleteSubscriber } from "@/app/admin/snailmail/actions";

/** Single-row delete control with a confirm() guard before the action runs. */
export default function DeleteSubscriberButton({ email }: { email: string }) {
  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(`Delete ${email} from the list?`)) {
      e.preventDefault();
    }
  }

  return (
    <form action={deleteSubscriber}>
      <input type="hidden" name="email" value={email} />
      <button
        type="submit"
        onClick={handleClick}
        style={{
          padding: "4px 10px",
          fontSize: 13,
          color: "#b00020",
          background: "transparent",
          border: "1px solid #b00020",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Delete
      </button>
    </form>
  );
}
