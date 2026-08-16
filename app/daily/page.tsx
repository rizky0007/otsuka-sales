import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function DailyPage() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1">
        <Header title="Input Harian" />

        <div className="p-8">
          <h1 className="text-2xl font-black">
            Input Harian
          </h1>

          <p className="text-slate-500 mt-2">
            Modul input harian akan dibuat pada tahap berikutnya.
          </p>
        </div>
      </main>
    </div>
  );
}