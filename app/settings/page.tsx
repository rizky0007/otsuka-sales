import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function SettingsPage() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1">
        <Header title="Pengaturan" />

        <div className="p-8">
          <h1 className="text-2xl font-black">
            Pengaturan
          </h1>

          <p className="text-slate-500 mt-2">
            Pengaturan aplikasi.
          </p>
        </div>
      </main>
    </div>
  );
}