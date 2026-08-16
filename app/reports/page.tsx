import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function ReportsPage() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1">
        <Header title="Laporan" />

        <div className="p-8">
          <h1 className="text-2xl font-black">
            Laporan
          </h1>

          <p className="text-slate-500 mt-2">
            Laporan pencapaian sales akan dibuat di sini.
          </p>
        </div>
      </main>
    </div>
  );
}