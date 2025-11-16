export default function Home() {
  return (
    <section className="flex flex-col gap-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-sky-400 to-cyan-400 text-white p-5 sm:p-7 shadow-md">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
          <div className="relative shrink-0">
            <img
              src="/baby.jpg"
              alt="Baby Harvin"
              className="h-40 w-40 sm:h-52 sm:w-52 object-cover rounded-3xl shadow-lg ring-4 ring-white/40"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/vite.svg'
              }}
            />
            <span className="absolute -bottom-2 -right-2 text-[10px] bg-white/90 text-slate-700 px-2 py-1 rounded-full shadow">
              Profile
            </span>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="text-2xl sm:text-3xl font-extrabold leading-tight">Welcome Baby</div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">Harvin Arora</div>
            <div className="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="text-xs bg-white/20 backdrop-blur px-2.5 py-1 rounded-full">Born 11 / 11 / 2025</span>
              <span className="text-xs bg-white/20 backdrop-blur px-2.5 py-1 rounded-full">Time 10 : 10 am</span>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <InfoTile label="Name" value="Harvin Arora" />
        <InfoTile label="Birth Date" value="11 / 11 / 2025" />
        <InfoTile label="Birth Time" value="10 : 10 am" />
        <InfoTile label="Father" value="Mohit Kumar" />
        <InfoTile label="Mother" value="Misha" />
        <InfoTile label="Elder Sister" value="Aavya" />
        <InfoTile label="Grandfather" value="Harish Kumar" />
        <InfoTile label="Grandmother" value="Neeru" />
      </div>

      
    </section>
  )
}

function InfoTile(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{props.label}</div>
      <div className="mt-0.5 font-semibold text-slate-800">{props.value}</div>
    </div>
  )
}


