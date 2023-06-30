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

  useEffect(() => {
    if (typeof window !== 'undefined')
      localStorage.setItem('table', JSON.stringify(table));
  }, [table])

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
    setTable(newTable);
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
      [name]: (name === 'reps') ? Number(value) : value
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
    setTable(t);
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
    <button onClick={() => setTable([])}>
      Delete all data
    </button>
    <h2>Entries</h2>
    <div style={{display: "grid", gridAutoFlow: "column"}}>
      {
        table.map((entry, idx) => {
          return <div key={idx} style={{display: "grid", gridAutoFlow: "column"}}>
            <div>
              {
                entry.date.toLocaleDateString()
              }
            </div>
            <div>{entry.name}</div>
            <div>{entry.reps}x</div>
            <div>{entry.weight}kg</div>
            <div>{entry.weight}rpe</div>
            <button onClick={() => handleRemove(idx)}>
              Remove
            </button>
          </div>
        })
      }
    </div>
    <h2>Activity Overview</h2>
    <div className={styles.activityOverview}>
      {
        activityDays.map(d => {
          return <div
            key={`activityOverview-day-${d.date.toISOString()}`}
            className={`${styles.activityOverviewDay}`}
            style={{
              gridRow: d.row,
              gridColumn: d.col,
              backgroundColor: d.count == 0
                ? `hsl(90, 0%, 80%)`
                : `hsl(123, ${Math.floor((d.count / maximumActivityCountSingleDay) * 100)}%, 40%)`
            }}
            title={`${d.count} Sets`}
          ></div>
        })
      }
    </div>
    <form
      onSubmit={handleFormSubmit}
      style={{
        display: "grid",
        gridAutoFlow: "column",
        position: "fixed",
        width: "100vw",
        bottom: 0,
        margin: 0,
        overflow: "hidden"
      }}
    >
      <div>
        {`${clock.toLocaleDateString()}`}
      </div>
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
        <input type="number" name="rpe" value={form.rpe ?? ""} onChange={handleInputChange} min={1} max={10}/>rpe
      </div>
      <button>Submit</button>
    </form>
  </>
}
