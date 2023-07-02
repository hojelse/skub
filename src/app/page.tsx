"use client"

import { ChangeEventHandler, FormEventHandler, useEffect, useMemo, useState } from "react";
import styles from './page.module.css'
import './global.css'

type FormEntry = {
  name: string | null
  reps: number | null
  weight: number | null
  rpe: number | null
}

type Entry = {
  date: Date
  name: string
  reps: number
  weight: number
  rpe: number
}

type Table = Entry[]

export default function Home() {
  // clock of current time
  const [clock, setClock] = useState<Date>(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setClock(new Date()), 500);
    return function cleanup() {
      clearInterval(timerId);
    };
  }, []);

  // local storage
  const [table, setTable] = useState<Table>(getLocalStorageTable());

  function setTableAndLocal(table: Table) {
    setTable(table)
    if (typeof window !== 'undefined')
      localStorage.setItem('table', JSON.stringify(table));
  }

  function getLocalStorageTable(): Table {
    if (typeof window === 'undefined') return [];
  
    const blah = localStorage.getItem('table')
    if (blah == null) return [];

    const table: Table = JSON.parse(blah);

    // revive dates
    const newTable = table.map(entry => {
      return {
        ...entry,
        date: new Date(entry.date)
      }
    })

    return newTable
  }

  function addEntry(formEntry: FormEntry) {
    if (formEntry.name == null) throw new Error("Name field is null")
    if (formEntry.reps == null) throw new Error("Reps field is null")
    if (formEntry.weight == null) throw new Error("Weight field is null")
    if (formEntry.rpe == null) throw new Error("RPE field is null")

    const entry: Entry = {
      date: clock,
      name: formEntry.name,
      reps: formEntry.reps,
      weight: formEntry.weight,
      rpe: formEntry.rpe,
    }

    const newTable = [...table, entry]
    setTableAndLocal(newTable);
  }

  // form
  const [form, setForm] = useState<FormEntry>({
    name: table[table.length-1]?.name,
    reps: table[table.length-1]?.reps,
    weight: table[table.length-1]?.weight,
    rpe: table[table.length-1]?.rpe,
  })

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = (evt) => {
    const { name, value } = evt.currentTarget

    const newForm = {
      ...form,
      [name]: (name === 'reps' || name === 'weight') ? Number(value) : value
    }

    setForm(newForm)
  }

  const handleSelectChange: ChangeEventHandler<HTMLSelectElement> = (evt) => {
    const { name, value } = evt.currentTarget

    const newForm = {
      ...form,
      [name]: (name === 'rpe') ? Number(value) : value
    }

    setForm(newForm)
  }

  const handleFormSubmit: FormEventHandler<HTMLFormElement> = (evt) => {
    evt.preventDefault()

    if (!form.name || !form.reps || !form.weight) throw new Error("Invalid input")

    addEntry(form)
  }

  const handleRemove = (idx: number) => {
    const t = table
    t.splice(idx, 1);
    setTableAndLocal(t);
  }

  const {activityDays, maximumActivityCountSingleDay} = useMemo(() => {
    const activityDays = []
    const now = clock
    const weekCount = 20

    let relativeWeeks = 1
    let tableIdx = table.length-1
    let maximumActivityCountSingleDay = 0
    for (let i = 0; i < 7*weekCount + now.getDay()+1; i++) {
      const d = new Date(now);
      d.setMilliseconds(0);
      d.setSeconds(0);
      d.setMinutes(0);
      d.setHours(0);
      d.setDate(d.getDate() - i);
      
      let activityCount = 0;
      while (tableIdx >= 0 && table[tableIdx]?.date > d) {
        activityCount += 1;
        tableIdx--;
      }

      if (activityCount > maximumActivityCountSingleDay) maximumActivityCountSingleDay = activityCount;

      activityDays.push({
        date: d,
        row: d.getDay()+1,
        col: weekCount+2-relativeWeeks,
        count: activityCount
      })
      if (d.getDay() == 0) relativeWeeks++;
    }
    return {activityDays, maximumActivityCountSingleDay}
  }, [])

  function mod(num: number, mod: number) {
    return (((num % mod) + mod) % mod)
  }

  return <>
    <button onClick={() => setTableAndLocal([])}>
      Delete all data
    </button>
    <div className={styles.activityOverview}>
      {
        activityDays.map(d => {

          const hue = 123
          const saturation = 100
          const lightness = 40 - Math.round((d.count / maximumActivityCountSingleDay) * 0.6)

          return <div
            key={`activityOverview-day-${d.date.toISOString()}`}
            className={`${styles.activityOverviewDay}`}
            style={{
              gridRow: d.row,
              gridColumn: d.col,
              backgroundColor: d.count == 0
                ? `hsl(90, 0%, 80%)`
                : `hsl(${hue}, ${saturation}%, ${lightness}%)`
            }}
            title={`${d.count} Sets`}
          ></div>
        })
      }
    </div>
    <div className={styles.entriesContainer}>
      {
        table.map((entry, idx, arr) => {
          const newDate =
            idx == 0 ||
            idx >= 1 
            && (entry.date.getDate() != arr[idx-1].date.getDate())

          return <>
            {
              newDate
              ? <div className={styles.entry}>
                {entry.date.toDateString()}
              </div>
              : null
            }
            <div key={idx} className={styles.entry}>
            <div>{entry.name}</div>
            <div>{entry.reps}x</div>
            <div>{entry.weight}kg</div>
            <div>{entry.rpe}</div>
            <button onClick={() => handleRemove(idx)}>
              x
            </button>
          </div>
          </>
        })
      }
    </div>
    <form
      onSubmit={handleFormSubmit}
      className={styles.form}
    >
      <div>
        <input type="text" name="name" value={form.name ?? ""} onChange={handleInputChange} />
      </div>
      <div>
        <input type="number" name="reps" value={form.reps ?? ""} onChange={handleInputChange} min={1}/>x
      </div>
      <div>
        <input type="number" name="weight" value={form.weight ?? ""} onChange={handleInputChange} min={1}/>kg
      </div>
      <div>
        <select name="rpe" value={`${form.rpe}`} onChange={handleSelectChange}>
          <option>1</option>
          <option>2</option>
          <option>3</option>
          <option>4</option>
          <option>5</option>
          <option>6</option>
          <option>7</option>
          <option>8</option>
          <option>9</option>
          <option>10</option>
        </select>
        rpe
      </div>
      <button>Add</button>
    </form>
  </>
}
