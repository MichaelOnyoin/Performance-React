import{useState}from'react';import{api}from'../api';
import{BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid}from'recharts';
export default function Dashboard(){
    const[month,setMonth]=useState(new Date().toISOString().slice(0,7)+'-01'),[data,setData]=useState(null),[error,setError]=useState('');
    async function load()
    {
        try
        {
            setData(await api(`/api/dashboard?month=${month}`));
            setError('')}
            catch(e)
            {
                setError(e.message)
            }
        }
        return <section>
            <div className="pagehead"><div><h1>Partner Dashboard</h1><p>Team and employee performance for the selected month.</p></div>
            <div className="actions"><input type="date" value={month} onChange={e=>setMonth(e.target.value)}/>
             <button onClick={load}>Load dashboard</button>
            </div>
            </div>
            {error&&
            <div className="error">{error}</div>}
            {data&&<>
            <div className="cards">
                <div>
                    <b>{data.teams.length}</b>
                    <span>Teams</span>
                </div>
                <div>
                 <b>{data.employees.length}</b>
                 <span>Employees</span>
                </div>
                <div>
                 <b>{data.month}</b>
                 <span>Reporting month</span>
                </div>
            </div>
            <div className="panel">
                <h2>Team average scores</h2>
                <ResponsiveContainer width="100%" height={300}>
                    {/* <BarChart data={data.teams}><CartesianGrid strokeDasharray="3 3"/> */}
                    <BarChart data={data.teams}><CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="team"/><YAxis/><Tooltip/>
                    <Bar dataKey="average_score" fill="#003b70"/></BarChart>
                </ResponsiveContainer>
            </div>
            <div className="panel">
                <h2>Employee ranking</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Team</th>
                            <th>Total score</th>
                            <th>Sum</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...data.employees].sort((a,b)=>b.total_score-a.total_score).map(x=>
                        <tr key={x.employee}>
                            <td>{x.employee}</td>
                            <td>{x.team}</td>
                            <td>{x.total_score.toFixed(3)}</td>
                            {/* <td>{s.total_score}</td> */}
                        </tr>
                        )}
                    </tbody>
                </table>
            </div></>}
        </section>}