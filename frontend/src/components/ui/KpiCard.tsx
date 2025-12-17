export const KpiCard = ({ title, value, icon, trend, color }: any) => (
  <div className={`p-6 rounded-xl border bg-[#1a1c23] border-white/10 relative overflow-hidden group`}>
    <div className={`absolute top-0 right-0 p-3 rounded-bl-xl border-b border-l ${color}`}>
        {icon}
    </div>
    <div className="relative z-10">
        <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-white mt-2 mb-1">{value}</p>
        <p className="text-xs text-gray-500">{trend}</p>
    </div>
    {/* EFECTO DE BRILLO */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
  </div>
);