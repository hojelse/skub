"use client"

import { ChangeEventHandler, FormEventHandler, useEffect, useState } from "react";

type FormEntry = {
  name: string | null
  reps: number | null
}

type Entry = {
  date: Date
  name: string
  reps: number
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
    localStorage.setItem('table', JSON.stringify(table));
  }, [table])

  function getLocalStorageTable(): Table {
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

    const entry: Entry = {
      date: clock,
      name: formEntry.name,
      reps: formEntry.reps,
    }

    const newTable = [...table, entry]
    setTable(newTable);
  }

  // form
  const [form, setForm] = useState<FormEntry>({
    name: table[table.length-1]?.name,
    reps: table[table.length-1]?.reps
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

    if (!form.name || !form.reps) throw new Error("Invalid input")

    addEntry(form)
  }

  const handleRemove = (idx: number) => {
    const t = table
    t.splice(idx, 1);
    setTable(t);
  }

  return <>
    <button onClick={() => setTable([])}>
      Delete all data
    </button>
    <div>
      {
        table.map((entry, idx) => {
          return <div key={idx} style={{display: "grid", gridAutoFlow: "column"}}>
            <div>{entry.date.toISOString()}</div>
            <div>{entry.name}</div>
            <div>{entry.reps}</div>
            <button onClick={() => handleRemove(idx)}>
              Remove
            </button>
          </div>
        })
      }
    </div>
    <form onSubmit={handleFormSubmit} style={{display: "grid", gridAutoFlow: "column"}}>
      <div>
        {clock.toISOString()}
      </div>
      <div>
        <input type="text" name="name" value={form.name ?? ""} onChange={handleInputChange} />
      </div>
      <div >
        <input type="number" name="reps" value={form.reps ?? ""} onChange={handleInputChange} min={1}/>
      </div>
      <button>Submit</button>
    </form>
  </>
}
