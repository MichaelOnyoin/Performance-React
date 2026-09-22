import{useState}from'react';
import{api}from'../api';
import Status from'../components/Status';
export default function Entries()
{
    const[month,setMonth]=useState(new Date().toISOString().slice(0,7)+'-01'),[employee,setEmployee]=useState(''),[rows,setRows]=useState([]),[error,setError]=useState('');
    async function load()
    {
        try
        {
            let q=`?month=${month}`;
            if(employee)q+=`&employee_id=${employee}`;
            setRows(await api('/api/entries'+q));
            setError('')
        }catch(e)
        {
            setError(e.message)
        }
    }
    async function save(r,actual)
    {
        console.log("Saving entry:", r);
        console.log("Entry ID:", r?.id);
        console.log("Actual:", actual);
        try
        {
            const u = await api(`/api/entries/${r.id}`,
                {
                    method:'PATCH',
                    body:JSON.stringify({actual:Number(actual)})});
                    setRows(rows.map(x=>x.id===u.id?u:x))}
                    catch(e){
                        setError(e.message)
                    }
                }
                async function submit(id)
                {
                    try{
                        const u=await api(`/api/entries/${id}/submit`,
                            {
                                method:'POST'
                            });
                            setRows(rows.map(x=>x.id===u.id?u:x))}
                            catch(e){
                                setError(e.message)
                            }
                        }
                        return <section>
                            <div className="pagehead">
                                <div>
                                    <h1>KPI Entries</h1>
                                    <p>Capture actuals and submit completed records.</p>
                                </div>
                                <div className="actions">
                                    <input type="date" value={month} onChange={e=>setMonth(e.target.value)}/>
                                    <input placeholder="Employee ID (optional)" value={employee} onChange={e=>setEmployee(e.target.value)}/>
                                    <button onClick={load}>Load</button>
                                </div>
                            </div>
                            {
                            error&&
                            <div className="error">{error}</div>}
                            <div className="panel tablewrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Employee</th>
                                            <th>KPI</th>
                                            <th>Actual</th>
                                            <th>Score</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map(r=><EntryRow key={r.id} r={r} save={save} submit={submit}/>)}
                                    </tbody>
                                </table>
                            </div>
                        </section>
}

function EntryRow({r,save,submit})
{
    const[actual,setV]=useState(r.actual??'');
    const editable=['Draft','Rejected'].includes(r.status);
    return <tr>
        <td>{r.id}</td>
        <td>{r.employee_id}</td>
        {/* <td>{r.name}</td> */}
        <td>{r.kpi_id}</td>
        <td>
            <input className="small" type="number" step="any" disabled={!editable} value={actual} onChange={e=>setV(e.target.value)}/>
        </td>
        <td>{r.final_score?.toFixed(2)??'—'}</td>
        <td><Status value={r.status}/></td>
        <td>{editable&&<>
         
         <button className="secondary" onClick={() => save(r, actual)}>
                    Save
                </button>
         <button onClick={()=>submit(r.id)}>Submit</button></>}
        </td>
        </tr>
}