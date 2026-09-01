type ActivityBarChartProps = {
  data: Array<{ label: string; value: number }>
}

export default function ActivityBarChart({ data }: ActivityBarChartProps) {
  const maxValue = Math.max(...data.map((item) => item.value), 1)
  const labelInterval = Math.max(1, Math.ceil(data.length / 7))

  return (
    <div className="relative h-60 pt-5" role="img" aria-label="Einträge pro Zeitabschnitt">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-8 top-5 flex flex-col justify-between"
        aria-hidden="true"
      >
        {[1, 0.75, 0.5, 0.25, 0].map((step) => (
          <div key={step} className="border-t border-dusty-taupe-100" />
        ))}
      </div>
      <div className="relative flex h-full items-end gap-1 sm:gap-2">
        {data.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end"
          >
            <div className="relative flex h-[calc(100%-2rem)] w-full items-end justify-center">
              <div
                className="w-full max-w-8 rounded-t-md bg-chocolate-plum-500 transition hover:bg-chocolate-plum-700"
                style={{
                  height: `${Math.max((item.value / maxValue) * 100, item.value ? 4 : 0)}%`,
                }}
              >
                <span className="sr-only">{`${item.label}: ${item.value} Einträge`}</span>
              </div>
              <span className="pointer-events-none absolute bottom-[calc(100%+0.35rem)] left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ash-brown-900 px-2 py-1 text-[11px] font-semibold text-white shadow-lg group-hover:block">
                {item.value} Einträge
              </span>
            </div>
            <span className="mt-2 h-6 truncate text-[10px] text-dusty-taupe-500 sm:text-xs">
              {index % labelInterval === 0 || index === data.length - 1 ? item.label : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
