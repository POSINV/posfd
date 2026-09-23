<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  days: { type: Array, default: () => [] }, // [{ date: 'YYYY-MM-DD', revenue: '123.00' }]
  currency: { type: String, default: '' },
})

const width = 640
const height = 220
const paddingBottom = 28
const paddingTop = 16
const barGap = 10

const values = computed(() => props.days.map((d) => Number(d.revenue) || 0))
const maxValue = computed(() => Math.max(...values.value, 1))

const bars = computed(() => {
  const n = props.days.length || 1
  const barWidth = (width - barGap * (n + 1)) / n
  const chartHeight = height - paddingBottom - paddingTop

  return props.days.map((day, i) => {
    const value = Number(day.revenue) || 0
    const barHeight = (value / maxValue.value) * chartHeight
    return {
      x: barGap + i * (barWidth + barGap),
      y: paddingTop + (chartHeight - barHeight),
      width: barWidth,
      height: Math.max(barHeight, value > 0 ? 3 : 0),
      value,
      label: formatDayLabel(day.date),
      date: day.date,
    }
  })
})

function formatDayLabel(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString(undefined, { weekday: 'short' })
}

function formatMoney(n) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

const hovered = ref(null)
</script>

<template>
  <div class="chart-wrap">
    <svg :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none" class="chart-svg">
      <defs>
        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6366F1" />
          <stop offset="100%" stop-color="#4F46E5" />
        </linearGradient>
        <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#818CF8" />
          <stop offset="100%" stop-color="#6366F1" />
        </linearGradient>
      </defs>

      <line
        :x1="0"
        :y1="height - paddingBottom"
        :x2="width"
        :y2="height - paddingBottom"
        stroke="rgba(17,24,39,0.08)"
        stroke-width="1"
      />

      <g v-for="(bar, i) in bars" :key="bar.date" @mouseenter="hovered = i" @mouseleave="hovered = null">
        <rect
          :x="bar.x"
          :y="bar.y"
          :width="bar.width"
          :height="bar.height"
          :fill="hovered === i ? 'url(#barGradientHover)' : 'url(#barGradient)'"
          rx="6"
          class="bar"
        />
        <rect :x="bar.x" :y="paddingTop" :width="bar.width" :height="height - paddingBottom - paddingTop" fill="transparent" />
        <text :x="bar.x + bar.width / 2" :y="height - paddingBottom + 16" text-anchor="middle" class="axis-label">
          {{ bar.label }}
        </text>
      </g>
    </svg>

    <div v-if="hovered !== null" class="tooltip" :style="{ left: `${(bars[hovered].x + bars[hovered].width / 2) / width * 100}%` }">
      {{ currency }} {{ formatMoney(bars[hovered].value) }}
    </div>
  </div>
</template>

<style scoped>
.chart-wrap {
  position: relative;
  width: 100%;
}

.chart-svg {
  width: 100%;
  height: 180px;
  display: block;
}

.bar {
  transition:
    fill 0.15s ease,
    opacity 0.15s ease;
  cursor: pointer;
}

.axis-label {
  font-size: 10px;
  fill: rgba(17, 24, 39, 0.5);
  font-family: var(--font-sans);
}

.tooltip {
  position: absolute;
  top: -4px;
  transform: translate(-50%, -100%);
  background: #111827;
  color: white;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
}
</style>
