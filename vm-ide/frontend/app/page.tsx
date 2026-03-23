import { redirect } from "next/navigation";

// The IDE frontend has no marketing pages — they live at vinexus.space
// Redirect root to the app (middleware will send unauthenticated users to /login)
export default function Root() {
  redirect("/app");
}
