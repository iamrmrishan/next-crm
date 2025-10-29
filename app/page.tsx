import { createClient } from "@/utils/supabase/server";
import { HomepageButton } from "@/components/homepage/homepage-button";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 lg:p-24 gap-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
          Welcome to Next CRM
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl">
          Manage your customer relationships efficiently
        </p>
      </div>

      <HomepageButton user={user} />
    </main>
  );
}