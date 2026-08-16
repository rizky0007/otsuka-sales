interface StatCardProps {
  title: string;
  value: string;
  description?: string;
}

export default function StatCard({
  title,
  value,
  description,
}: StatCardProps) {
  return (
    <div className="
      bg-white
      border
      border-slate-200
      rounded-2xl
      p-5
      shadow-sm
    ">
      <p className="text-xs text-slate-500">
        {title}
      </p>

      <p className="text-2xl font-black mt-2">
        {value}
      </p>

      {description && (
        <p className="text-xs text-slate-400 mt-1">
          {description}
        </p>
      )}
    </div>
  );
}