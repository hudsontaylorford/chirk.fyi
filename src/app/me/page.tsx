import { redirect } from "next/navigation";

// chirk.fyi/me, the address in emails: Your events lists what you host and what you're invited to (or asks you to sign in).
export default function Me() {
  redirect("/host");
}
