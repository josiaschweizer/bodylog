type ActivityBarChartProps = {
  data: Array<{ label: string; value: number }>
}

export default function ActivityBarChart({ data }: ActivityBarChartProps) {
  const maxValue = Math.max(...data.map((item) => item.value), 1)

  return (
    <div className="flex h-52 items-end gap-2 sm:gap-4" role="img" aria-label="Einträge pro Tag">
      {data.map((item) => (
        <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
          <span className="text-xs font-semibold text-dusty-taupe-600">{item.value || ''}</span>
          <div className="flex h-36 w-full items-end rounded-lg bg-dusty-taupe-100 p-1">
            <div
              className="w-full rounded-md bg-chocolate-plum-600 transition-[height] duration-500"
              style={{ height: `${Math.max((item.value / maxValue) * 100, item.value ? 8 : 0)}%` }}
            />
          </div>
          <span className="text-xs text-dusty-taupe-600">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
