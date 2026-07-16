import type { Filter } from '../types'

interface Props {
  value: Filter
  onChange: (filter: Filter) => void
}

const OPTIONS: { value: Filter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'active', label: '미완료' },
  { value: 'completed', label: '완료' },
]

function FilterBar({ value, onChange }: Props) {
  return (
    <div className="filter-bar">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          className={opt.value === value ? 'active' : ''}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default FilterBar
