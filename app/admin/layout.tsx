import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin Dashboard | EditorKit",
  description: "관리자 전용 대시보드",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  const role = profile?.role || "user";

  if (role === "user") {
    redirect("/");
  }

  const isAdmin = role === "admin";

  return (
    <div className="min-h-screen bg-[#F5F4F0] dark:bg-[#121212] flex flex-col md:flex-row border-t-4 border-[#222222] dark:border-[#444444]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-[#1E1E1E] border-b-4 md:border-b-0 md:border-r-4 border-[#222222] dark:border-[#444444] p-6 flex flex-col shrink-0">
        <h2 className="text-2xl font-black text-[#222222] dark:text-[#EAEAEA] mb-8 tracking-tighter flex items-center gap-2">
          <span className="material-symbols-outlined text-[28px]">shield</span>
          Admin
        </h2>

        <nav className="flex flex-col gap-4">
          <Link 
            href="/admin/posts"
            className="px-4 py-3 bg-[#F5F4F0] dark:bg-[#2A2A2A] text-[#222222] dark:text-[#EAEAEA] border-2 border-[#222222] dark:border-[#555555] font-bold shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#222222] dark:hover:shadow-[2px_2px_0px_#111111] transition-all flex items-center gap-3"
          >
            <span className="material-symbols-outlined">article</span>
            게시물 관리
          </Link>

          {isAdmin && (
            <Link 
              href="/admin/users"
              className="px-4 py-3 bg-[#F5F4F0] dark:bg-[#2A2A2A] text-[#222222] dark:text-[#EAEAEA] border-2 border-[#222222] dark:border-[#555555] font-bold shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#222222] dark:hover:shadow-[2px_2px_0px_#111111] transition-all flex items-center gap-3"
            >
              <span className="material-symbols-outlined">group</span>
              회원 관리
            </Link>
          )}
        </nav>

        <div className="mt-auto pt-8">
          <div className="text-xs font-bold text-[#A0A0A0] dark:text-[#666666] tracking-widest uppercase">
            Current Role:
          </div>
          <div className="inline-flex mt-1 px-2 py-1 bg-[#222222] dark:bg-[#EAEAEA] text-[#F5F4F0] dark:text-[#121212] font-black text-sm uppercase">
            {role}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
