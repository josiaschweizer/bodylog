type TrendPoint = {
  label: string
  value: number | null
  secondaryValue?: number | null
}

type TrendLineChartProps = {
  data: TrendPoint[]
  ariaLabel: string
  color?: string
  secondaryColor?: string
  valueLabel?: (value: number) => string
  domain?: [number, number]
  tickValues?: number[]
  referenceBand?: {
    from: number
    to: number
    label?: string
    color?: string
  }
}

const WIDTH = 760
const HEIGHT = 250
const PADDING = { top: 22, right: 20, bottom: 36, left: 42 }

function buildPath(
  data: TrendPoint[],
  valueKey: 'value' | 'secondaryValue',
  minValue: number,
  maxValue: number,
) {
  const plotWidth = WIDTH - PADDING.left - PADDING.right
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom
  let path = ''
  let segmentOpen = false

  data.forEach((point, index) => {
    const value = point[valueKey]
    if (value === null || value === undefined) {
      segmentOpen = false
      return
    }

    const x =
      PADDING.left + (data.length === 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth)
    const y = PADDING.top + ((maxValue - value) / Math.max(maxValue - minValue, 1)) * plotHeight
    path += `${segmentOpen ? ' L' : 'M'} ${x} ${y}`
    segmentOpen = true
  })

  return path
}

export default function TrendLineChart({
  data,
  ariaLabel,
  color = '#7a5452',
  secondaryColor = '#b6957c',
  valueLabel = (value) => String(value),
  domain,
  tickValues,
  referenceBand,
}: TrendLineChartProps) {
  const allValues = data.flatMap((point) =>
    [point.value, point.secondaryValue].filter(
      (value): value is number => value !== null && value !== undefined,
    ),
  )
  const hasData = allValues.length > 0
  const dataMin = hasData ? Math.min(...allValues) : 0
  const dataMax = hasData ? Math.max(...allValues) : 1
  const padding = Math.max((dataMax - dataMin) * 0.15, dataMax === dataMin ? 1 : 0)
  const minValue = domain?.[0] ?? Math.max(0, dataMin - padding)
  const maxValue = domain?.[1] ?? dataMax + padding
  const plotWidth = WIDTH - PADDING.left - PADDING.right
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom
  const labelInterval = Math.max(1, Math.ceil(data.length / 6))
  const yTicks =
    tickValues ??
    [0, 0.25, 0.5, 0.75, 1].map((step) => maxValue - step * Math.max(maxValue - minValue, 1))

  if (!hasData) {
    return (
      <div className="grid h-56 place-items-center rounded-xl bg-khaki-beige-50 px-6 text-center text-sm text-dusty-taupe-600">
        Für diesen Zeitraum sind keine passenden Messwerte vorhanden.
      </div>
    )
  }

  return (
    <div className="w-full" role="img" aria-label={ariaLabel}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full overflow-visible">
        {referenceBand ? (
          <g>
            <rect
              x={PADDING.left}
              y={
                PADDING.top +
                ((maxValue - Math.max(referenceBand.from, referenceBand.to)) /
                  Math.max(maxValue - minValue, 1)) *
                  plotHeight
              }
              width={plotWidth}
              height={
                (Math.abs(referenceBand.to - referenceBand.from) /
                  Math.max(maxValue - minValue, 1)) *
                plotHeight
              }
              fill={referenceBand.color ?? '#e8f1ea'}
              rx="6"
            />
            {referenceBand.label ? (
              <text
                x={WIDTH - PADDING.right - 6}
                y={
                  PADDING.top +
                  ((maxValue - Math.max(referenceBand.from, referenceBand.to)) /
                    Math.max(maxValue - minValue, 1)) *
                    plotHeight +
                  14
                }
                textAnchor="end"
                className="fill-[#55736b] text-[10px] font-semibold"
              >
                {referenceBand.label}
              </text>
            ) : null}
          </g>
        ) : null}

        {yTicks.map((value) => {
          const y =
            PADDING.top + ((maxValue - value) / Math.max(maxValue - minValue, 1)) * plotHeight
          return (
            <g key={value}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={y}
                y2={y}
                stroke="#e9e6e2"
                strokeWidth="1"
              />
              <text
                x={PADDING.left - 9}
                y={y + 4}
                textAnchor="end"
                className="fill-dusty-taupe-500 text-[11px]"
              >
                {valueLabel(value)}
              </text>
            </g>
          )
        })}

        <path
          d={buildPath(data, 'secondaryValue', minValue, maxValue)}
          fill="none"
          stroke={secondaryColor}
          strokeWidth="2.5"
          strokeDasharray="6 6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={buildPath(data, 'value', minValue, maxValue)}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {data.map((point, index) => {
          if (point.value === null) {
            return null
          }
          const x =
            PADDING.left +
            (data.length === 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth)
          const y =
            PADDING.top + ((maxValue - point.value) / Math.max(maxValue - minValue, 1)) * plotHeight
          return (
            <circle
              key={`${point.label}-${index}`}
              cx={x}
              cy={y}
              r="4.5"
              fill={color}
              stroke="white"
              strokeWidth="2"
            >
              <title>{`${point.label}: ${valueLabel(point.value)}`}</title>
            </circle>
          )
        })}

        {data.map((point, index) => {
          if (index % labelInterval !== 0 && index !== data.length - 1) {
            return null
          }
          const x =
            PADDING.left +
            (data.length === 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth)
          return (
            <text
              key={`${point.label}-label`}
              x={x}
              y={HEIGHT - 10}
              textAnchor="middle"
              className="fill-dusty-taupe-500 text-[11px]"
            >
              {point.label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
