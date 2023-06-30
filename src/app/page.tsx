"use client"

import { ChangeEventHandler, FormEventHandler, useEffect, useState } from "react";

type FormEntry = {
  date: Date | null
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
  });

  // local storage
  
  const [table, setTable] = useState<Table>([]);

  useEffect(() => {
    localStorage.setItem('table', JSON.stringify(table));
  }, [table]);

  useEffect(() => {
    const s = localStorage.getItem('table');
    const table = s ? JSON.parse(s) : {};
    if (s) {
     setTable(table);
    }
  }, []);

  function addEntry(entry: Entry) {
    table.push(entry)
    setTable(table);
  }

  // form

  const [form, setForm] = useState<FormEntry>({ date: new Date(), name: null, reps: null })

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = (evt) => {
    const { name, value } = evt.currentTarget

    const newForm = {
      ...form,
      date: clock,
      [name]: (name === 'reps') ? Number(value) : value
    }

    setForm(newForm)
  }

  const handleFormSubmit: FormEventHandler<HTMLFormElement> = (evt) => {
    evt.preventDefault()

    if (!form.date || !form.name || !form.reps) throw new Error("Invalid input")

    addEntry(form as Entry)
  }

  return <>
    <div>
        {
          table.map(entry => {
            return <div key={entry.date.toISOString()} style={{display: "grid", gridAutoFlow: "column"}}>
              <div>{entry.date.toISOString()}</div>
              <div>{entry.name}</div>
              <div>{entry.reps}</div>
              <button>Remove</button>
            </div>
          })
        }
    </div>
    <form onSubmit={handleFormSubmit} style={{display: "grid", gridAutoFlow: "column"}}>
      <div>
        {form.date?.toISOString()}
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
