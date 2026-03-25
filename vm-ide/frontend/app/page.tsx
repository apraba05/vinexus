import { auth } from "@/auth";
import { redirect } from "next/navigation";

// The IDE frontend is the product app. Public marketing lives on vinexus.space.
// Browser users who already have a session should land in the product dashboard,
// while unauthenticated visitors still go to the public marketing site.
export default async function Root() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }
  redirect("https://vinexus.space");
}
