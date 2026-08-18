import { Plus, Trash2 } from 'lucide-react'
import { MEAL_TYPES } from '@/lib/tracking'
import type { MealType } from '@/lib/tracking'
import { addEmptyFoodItem } from '@/lib/tracking-form'
import type { FoodItemDraft } from '@/lib/tracking-form'

type FoodEntryFieldsProps = {
  mealType: MealType
  onMealTypeChange: (mealType: MealType) => void
  items: FoodItemDraft[]
  onItemsChange: (items: FoodItemDraft[]) => void
}

export default function FoodEntryFields({
  mealType,
  onMealTypeChange,
  items,
  onItemsChange,
}: FoodEntryFieldsProps) {
  function updateItem(id: string, changes: Partial<FoodItemDraft>) {
    onItemsChange(items.map((item) => (item.id === id ? { ...item, ...changes } : item)))
  }

  return (
    <fieldset className="rounded-2xl border border-dusty-taupe-200 bg-white p-4 sm:p-5">
      <legend className="px-2 text-sm font-bold text-chocolate-plum-800">Details zum Essen</legend>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-ash-brown-800">Mahlzeit</span>
        <select
          value={mealType}
          onChange={(event) => onMealTypeChange(event.target.value as MealType)}
          className="w-full rounded-xl border border-dusty-taupe-300 bg-white px-4 py-3 text-ash-brown-950 outline-none focus:border-chocolate-plum-500 focus:ring-4 focus:ring-chocolate-plum-100"
        >
          {MEAL_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ash-brown-800">Was hast du gegessen?</p>
          <span className="text-xs text-dusty-taupe-500">
            {items.length} Position{items.length === 1 ? '' : 'en'}
          </span>
        </div>

        {items.map((item, index) => (
          <div
            key={item.id}
            className="rounded-xl border border-dusty-taupe-200 bg-khaki-beige-50 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wide text-chocolate-plum-600">
                Position {index + 1}
              </span>
              {items.length > 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    onItemsChange(items.filter((candidate) => candidate.id !== item.id))
                  }
                  className="grid size-11 place-items-center rounded-xl text-dusty-taupe-500 hover:bg-chocolate-plum-100 hover:text-chocolate-plum-700 active:bg-chocolate-plum-200"
                  aria-label={`Position ${index + 1} entfernen`}
                >
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              ) : null}
            </div>

            <input
              required
              value={item.name}
              onChange={(event) => updateItem(item.id, { name: event.target.value })}
              placeholder="z. B. gemischter Salat mit Ei und Bohnen"
              className="mt-2 w-full rounded-xl border border-dusty-taupe-300 bg-white px-3 py-2.5 text-sm text-ash-brown-950 outline-none placeholder:text-dusty-taupe-400 focus:border-chocolate-plum-500 focus:ring-3 focus:ring-chocolate-plum-100"
            />

            <div className="mt-2 grid grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)] gap-2">
              <label>
                <span className="sr-only">Menge</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.amount}
                  onChange={(event) => updateItem(item.id, { amount: event.target.value })}
                  placeholder="Menge"
                  className="w-full rounded-xl border border-dusty-taupe-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-chocolate-plum-500 focus:ring-3 focus:ring-chocolate-plum-100"
                />
              </label>
              <label>
                <span className="sr-only">Einheit</span>
                <input
                  list="food-units"
                  value={item.unit}
                  onChange={(event) => updateItem(item.id, { unit: event.target.value })}
                  placeholder="Einheit, z. B. Teller"
                  className="w-full rounded-xl border border-dusty-taupe-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-chocolate-plum-500 focus:ring-3 focus:ring-chocolate-plum-100"
                />
              </label>
            </div>
          </div>
        ))}

        <datalist id="food-units">
          <option value="Teller" />
          <option value="Portion" />
          <option value="Schüssel" />
          <option value="Stück" />
          <option value="Gramm" />
          <option value="Milliliter" />
        </datalist>

        <button
          type="button"
          onClick={() => onItemsChange(addEmptyFoodItem(items))}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-chocolate-plum-300 px-4 py-3 text-sm font-semibold text-chocolate-plum-700 transition hover:bg-chocolate-plum-50"
        >
          <Plus size={18} aria-hidden="true" />
          Weitere Position hinzufügen
        </button>
      </div>
    </fieldset>
  )
}
