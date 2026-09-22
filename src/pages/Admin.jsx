import{useState}from'react';
import{api}from'../api';

export default function Admin()
{
    const[month,setMonth]=useState(new Date().toISOString().slice(0,7)+'-01'),[msg,setMsg]=useState('');
    async function generate()
    {
        try{
            const x=await api('/api/admin/generate-month',
            {
                method:'POST',
                body:JSON.stringify({month})
            });
            setMsg(`${x.created} KPI entries created.`)
         }
            catch(e)
            {
                setMsg(e.message)
            }
        }
        return <section><h1>Administration</h1><p>Generate missing KPI records for every employee and KPI.</p>
               <div className="panel"><label>Month<input type="date" value={month} onChange={e=>setMonth(e.target.value)}/></label>
               <button onClick={generate}>Generate monthly KPIs</button>
               {msg&&<div className="notice">{msg}
                </div>}</div>
                </section>}