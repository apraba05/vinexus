import { auth } from "@/auth";
import { redirect } from "next/navigation";

// The IDE frontend is the product app.
// Authenticated users land on the dashboard; everyone else sees the login page.
// Never redirect to an external domain — localhost must stay self-contained.
export default async function Root() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }
  redirect("/login");
}
