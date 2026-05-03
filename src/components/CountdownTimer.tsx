import * as React from 'react'

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}

function calculateTimeRemaining(targetDate: Date): TimeRemaining {
  const now = new Date()
  const diff = targetDate.getTime() - now.getTime()

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    isExpired: false,
  }
}

interface CountdownTimerProps {
  targetDate: Date | string
  compact?: boolean
}

export function CountdownTimer({ targetDate, compact = false }: CountdownTimerProps) {
  const date = typeof targetDate === 'string' ? new Date(targetDate) : targetDate
  const [time, setTime] = React.useState<TimeRemaining>(calculateTimeRemaining(date))

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(calculateTimeRemaining(date))
    }, 1000)

    return () => clearInterval(timer)
  }, [date])

  if (time.isExpired) {
    return <span className="text-xs font-semibold text-green-600 dark:text-green-400">Launching now</span>
  }

  if (compact) {
    return (
      <span className="text-xs font-mono font-semibold">
        {time.days}d {time.hours}h {time.minutes}m
      </span>
    )
  }

  return (
    <div className="flex gap-3 items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="text-2xl font-bold tabular-nums">{String(time.days).padStart(2, '0')}</div>
        <div className="text-xs text-muted-foreground font-medium">Days</div>
      </div>
      <div className="text-muted-foreground">:</div>
      <div className="flex flex-col items-center">
        <div className="text-2xl font-bold tabular-nums">{String(time.hours).padStart(2, '0')}</div>
        <div className="text-xs text-muted-foreground font-medium">Hours</div>
      </div>
      <div className="text-muted-foreground">:</div>
      <div className="flex flex-col items-center">
        <div className="text-2xl font-bold tabular-nums">{String(time.minutes).padStart(2, '0')}</div>
        <div className="text-xs text-muted-foreground font-medium">Minutes</div>
      </div>
      <div className="text-muted-foreground">:</div>
      <div className="flex flex-col items-center">
        <div className="text-2xl font-bold tabular-nums">{String(time.seconds).padStart(2, '0')}</div>
        <div className="text-xs text-muted-foreground font-medium">Seconds</div>
      </div>
    </div>
  )
}
